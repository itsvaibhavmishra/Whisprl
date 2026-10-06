import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import { postingProgress, statusAdded, statusRemoved, statusSeen } from "@/redux/slices/statusSlice";
import { ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE, pickFiles, prepareImage, wholePercents } from "@/utils/attachments";
import axios from "@/utils/axios";
import { sealFile } from "@/utils/crypto/fileCipher";
import { encryptStatus, openStatus } from "@/utils/crypto/statusCipher";
import { errorMessageOf, notify } from "@/utils/notify";
import { COMPRESS_SHARE, VideoRefusal, compressVideo, probeVideo } from "@/utils/video";

let postingController = null;

const withContent = async (status) => ({ ...status, content: await openStatus(status) });

// a status this browser cannot open is left out rather than shown empty
const readable = async (statuses) =>
  (await Promise.allSettled(statuses.map(withContent))).filter((result) => result.status === "fulfilled").map((result) => result.value);

// ------------- Statuses -------------
export const GetStatuses = createApiThunk("status/list", async () => readable((await axios.get("/status")).data.statuses));

export const ReceiveStatus = (status) => async (dispatch) => {
  const [opened] = await readable([status]);
  if (opened) dispatch(statusAdded(opened));
};

// ------------- Choose A Photo Or Video -------------
// a photo is shrunk now and a video only read, since compressing it waits until it is shared
const draftOf = async (file) =>
  file.type.startsWith("video/") ? { kind: "video", file, ...(await probeVideo(file)) } : { kind: "image", ...(await prepareImage(file)) };

const refused = (message) => {
  notify({ severity: "info", message });
  return null;
};

export const ChooseStatusMedia = () => async () => {
  const [file] = await pickFiles(ATTACHMENT_TYPES.media, { multiple: false });
  if (!file) return null;
  try {
    const draft = await draftOf(file);
    return draft.kind === "image" && draft.file.size > MAX_ATTACHMENT_SIZE ? refused(`${file.name} is larger than 5 MB`) : draft;
  } catch (error) {
    return refused(error instanceof VideoRefusal ? error.message : `${file.name} could not be opened`);
  }
};

// ------------- Post -------------
const compressedIfVideo = async (draft, signal, report) => {
  if (draft.kind !== "video") return draft;
  const onProgress = (fraction) => report(fraction * COMPRESS_SHARE);
  const shrunk = await compressVideo(draft.file, { duration: draft.duration, onProgress, signal });
  return { ...draft, file: shrunk.file, width: shrunk.width ?? draft.width, height: shrunk.height ?? draft.height };
};

const contentOf = ({ kind, text, background, caption, file, width, height, duration, preview }, sealed) => {
  if (kind === "text") return { kind, text, background };
  return { kind, caption, file: { key: sealed.key, iv: sealed.iv, mimeType: file.type, width, height, duration, preview } };
};

export const PostStatus = (draft) => async (dispatch, getState) => {
  const controller = new AbortController();
  const { signal } = controller;
  postingController = controller;
  const report = wholePercents((percent) => dispatch(postingProgress(percent)));
  report(0);

  try {
    const ready = await compressedIfVideo(draft, signal, report);
    const sealed = ready.file && (await sealFile(await ready.file.arrayBuffer()));
    const content = contentOf(ready, sealed);
    const { sealedFor } = (await axios.get("/status/sealed-for", { signal })).data;

    const form = new FormData();
    form.append("cipher", JSON.stringify(await encryptStatus(content, sealedFor, getState().user.user._id)));
    if (sealed) form.append("file", new Blob([sealed.data]));

    const uploadFrom = ready.kind === "video" ? COMPRESS_SHARE : 0;
    const onUploadProgress = ({ loaded, total }) => total && report(uploadFrom + (loaded / total) * (100 - uploadFrom));
    const { data } = await axios.post("/status", form, { signal, onUploadProgress });
    dispatch(statusAdded({ ...data.posted, content }));
  } catch (error) {
    if (!signal.aborted) notify({ severity: "error", message: error instanceof VideoRefusal ? error.message : errorMessageOf(error) });
  } finally {
    if (postingController === controller) dispatch(postingProgress(null));
  }
};

export const CancelPosting = () => () => postingController?.abort();

// ------------- Viewed -------------
export const MarkStatusViewed = (statusId) => (dispatch) => {
  dispatch(statusSeen(statusId));
  axios.post(`/status/${statusId}/view`).catch(() => {});
};

// ------------- Delete -------------
export const DeleteStatus = createApiThunk("status/delete", async (statusId, { dispatch }) => {
  await axios.delete(`/status/${statusId}`);
  dispatch(statusRemoved({ _id: statusId }));
});

// ------------- Hidden From -------------
export const GetHiddenFrom = createApiThunk("status/hidden-from", async () => (await axios.get("/status/hidden-from")).data.hiddenFrom);

export const SetHiddenFrom = createApiThunk("status/set-hidden-from", async (ids) => {
  const { data } = await axios.put("/status/hidden-from", { hiddenFrom: ids });
  return data.hiddenFrom;
});
