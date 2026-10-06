import { createAsyncThunk } from "@reduxjs/toolkit";

import { FlushOutbox, ReceiveMessageUpdate } from "@/redux/slices/actions/chatActions";
import {
  addFiles,
  clearFiles,
  clearUploadFailed,
  markUploadFailed,
  queueMessage,
  removeFile,
  removeMessage,
  transferEnded,
  transferProgress,
  updateQueuedMessage,
} from "@/redux/slices/chatSlice";
import {
  ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  attachmentFile,
  cancelTransfer,
  dropSealedCopy,
  holdAttachment,
  isCurrentTransfer,
  keepSealedCopy,
  pickFiles,
  prepareImage,
  releaseAttachment,
  replaceHeldFile,
  sealedCopyOf,
  sentMessageIdOf,
  startTransfer,
} from "@/utils/attachments";
import axios from "@/utils/axios";
import { sealFile } from "@/utils/crypto/fileCipher";
import { notify, notifyError } from "@/utils/notify";
import { VideoRefusal, compressVideo, probeVideo } from "@/utils/video";
import uuidv4 from "@/utils/uuidv4";

const UPLOAD_PAUSES = [2000, 5000];
// a video's progress is mostly compressing, so that takes the first part of its circle and uploading the rest
const COMPRESS_SHARE = 60;

const kindOf = (file) => {
  if (file.type.startsWith("image/")) return "image";
  return file.type.startsWith("video/") ? "video" : "doc";
};

const typeLabelOf = (kind, file) => {
  if (kind === "image") return file.type.split("/")[1].toUpperCase();
  return kind === "video" ? "VIDEO" : file.name.split(".").pop().toUpperCase();
};

const groupOf = (chosenFile) => (chosenFile.kind === "doc" ? "doc" : "media");

const signatureOf = (file) => `${file.name}:${file.size}:${file.lastModified}`;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// a photo is shrunk now and a video only read, since compressing a video waits until it is sent
const prepareForDraft = async (file) => {
  const kind = kindOf(file);
  if (kind === "image") return prepareImage(file);
  return kind === "video" ? { file, ...(await probeVideo(file)) } : { file };
};

// only whole steps go to the store, so a fast encoder does not flood it
const progressReporter = (dispatch, clientId, from, to) => {
  let shown = -1;
  return (fraction) => {
    const percent = Math.floor(from + fraction * (to - from));
    if (percent === shown) return;
    shown = percent;
    dispatch(transferProgress({ clientId, percent }));
  };
};

// ------------- Choose Attachments -------------
export const ChooseAttachments = (kind) => async (dispatch, getState) => {
  const chosen = getState().chat.files;
  const kindInUse = chosen.length ? groupOf(chosen[0]) : kind;
  if (chosen.length >= MAX_ATTACHMENTS) {
    notify({ severity: "info", message: `Maximum ${MAX_ATTACHMENTS} files allowed per message` });
    return;
  }

  const picked = await pickFiles(ATTACHMENT_TYPES[kindInUse]);
  const known = new Set(getState().chat.files.map((file) => file.signature));
  const refused = (message) => {
    notify({ severity: "info", message });
    return false;
  };

  const fresh = picked.filter((file) => {
    if (!ATTACHMENT_TYPES[kindInUse].includes(file.type)) return refused(`${file.name} is not a file type Whisprl can send`);
    return !known.has(signatureOf(file));
  });
  const ready = await Promise.all(
    fresh.map((file) =>
      prepareForDraft(file).then(
        (prepared) => ({ signature: signatureOf(file), ...prepared }),
        (error) => refused(error instanceof VideoRefusal ? error.message : `${file.name} could not be opened`)
      )
    )
  );
  const accepted = ready
    .filter(Boolean)
    .filter(({ file }) => kindOf(file) === "video" || file.size <= MAX_ATTACHMENT_SIZE || refused(`${file.name} is larger than 5 MB`));

  const room = MAX_ATTACHMENTS - getState().chat.files.length;
  if (accepted.length > room) refused(`Maximum ${MAX_ATTACHMENTS} files allowed per message`);

  accepted.slice(0, room).forEach(({ file, signature, width, height, preview, duration }) => {
    const fileKind = kindOf(file);
    dispatch(
      addFiles({
        id: holdAttachment(file),
        kind: fileKind,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        typeLabel: typeLabelOf(fileKind, file),
        signature,
        width,
        height,
        preview,
        duration,
      })
    );
  });
};

// ------------- Discard Chosen Attachments -------------
export const RemoveAttachment = (id) => (dispatch) => {
  releaseAttachment(id);
  dispatch(removeFile(id));
};

export const ClearAttachments = () => (dispatch, getState) => {
  getState().chat.files.forEach((file) => releaseAttachment(file.id));
  dispatch(clearFiles());
};

const detailsOf = ({ fileName, mimeType, size, width, height, preview, duration, kind }) => ({
  name: fileName,
  mimeType,
  size,
  width,
  height,
  preview,
  duration,
  kind: kind === "doc" ? "document" : kind,
});

const sealedKeyOf = async (clientId) => {
  const { data, key, iv } = await sealFile(await attachmentFile(clientId).arrayBuffer());
  keepSealedCopy(clientId, data);
  return { key, iv };
};

// ------------- Prepare A Queued File -------------
// a video is compressed and every file sealed, then the outbox sends its message; cancelling leaves it to send again
export const PrepareQueued = (clientId) => async (dispatch, getState) => {
  const entry = getState().chat.outbox.find((queued) => queued.clientId === clientId);
  if (!entry || entry.status === "failed") return;

  const controller = startTransfer(clientId);
  const isLatest = () => isCurrentTransfer(clientId, controller);
  dispatch(updateQueuedMessage({ clientId, status: "preparing", error: null }));
  dispatch(transferProgress({ clientId, percent: 0 }));

  try {
    let { file } = entry;
    if (file.kind === "video") {
      const report = progressReporter(dispatch, clientId, 0, COMPRESS_SHARE);
      const shrunk = await compressVideo(attachmentFile(clientId), { duration: file.duration, onProgress: report, signal: controller.signal });
      replaceHeldFile(clientId, shrunk.file);
      file = { ...file, name: shrunk.file.name, mimeType: shrunk.file.type, size: shrunk.file.size, width: shrunk.width ?? file.width, height: shrunk.height ?? file.height };
    }
    controller.signal.throwIfAborted();
    file = { ...file, ...(await sealedKeyOf(clientId)) };
    if (!isLatest()) return;
    dispatch(updateQueuedMessage({ clientId, status: "sending", file }));
    dispatch(FlushOutbox());
  } catch (error) {
    if (!isLatest()) return;
    dispatch(transferEnded(clientId));
    const reason = error instanceof VideoRefusal ? error.message : "this file could not be prepared";
    dispatch(updateQueuedMessage({ clientId, status: "failed", error: controller.signal.aborted ? null : reason }));
  }
};

// ------------- Send Chosen Attachments -------------
// photos and videos go as one captioned group; a single document carries the caption itself
export const SendAttachments = (caption, isViewOnce = false) => async (dispatch, getState) => {
  const { files, activeConversation, messages } = getState().chat;
  if (!files.length) return;
  dispatch(clearFiles());

  const isMedia = files[0].kind !== "doc";
  const captionFor = (index) => ((isMedia && index === 0) || (!isMedia && files.length === 1) ? caption : undefined);
  const batchId = uuidv4();

  // queued before anything is compressed or sealed, so a message typed straight after can never overtake the files
  files.forEach((attachment, index) =>
    dispatch(
      queueMessage({
        clientId: attachment.id,
        status: "preparing",
        senderId: getState().user.user._id,
        conversationId: activeConversation._id,
        afterId: messages.at(-1)?._id,
        createdAt: new Date().toISOString(),
        caption: captionFor(index),
        // a view-once file travels without its preview, which would otherwise outlive it
        file: isViewOnce ? { ...detailsOf(attachment), preview: undefined } : detailsOf(attachment),
        batch: { batchId, batchIndex: index, batchTotal: files.length },
        ...(isViewOnce && { viewOnce: true }),
      })
    )
  );

  // one at a time, so the files ahead in the group are not slowed by a video being compressed behind them
  for (const attachment of files) await dispatch(PrepareQueued(attachment.id));
};

// ------------- Cancel A Send -------------
// a file still waiting its turn has nothing running to stop, so it is simply marked as not sent
export const CancelTransfer = (clientId) => (dispatch, getState) => {
  if (cancelTransfer(clientId)) return;
  const isWaiting = getState().chat.outbox.some((queued) => queued.clientId === clientId && queued.status === "preparing");
  if (isWaiting) dispatch(updateQueuedMessage({ clientId, status: "failed", error: null }));
  dispatch(transferEnded(clientId));
};

// ------------- Upload An Attachment's File -------------
export const UploadAttachment = createAsyncThunk("message/upload-attachment", async (clientId, { dispatch }) => {
  const form = new FormData();
  form.append("file", sealedCopyOf(clientId));
  const controller = startTransfer(clientId);
  const isVideo = Boolean(attachmentFile(clientId)?.type.startsWith("video/"));
  const report = progressReporter(dispatch, clientId, isVideo ? COMPRESS_SHARE : 0, 100);
  const onUploadProgress = ({ loaded, total }) => total && report(loaded / total);

  for (const retryPause of [...UPLOAD_PAUSES, null]) {
    try {
      const { data } = await axios.post(`/message/${sentMessageIdOf(clientId)}/attachment`, form, { signal: controller.signal, onUploadProgress });
      dispatch(transferEnded(clientId));
      dispatch(clearUploadFailed(clientId));
      await dispatch(ReceiveMessageUpdate(data.message));
      dropSealedCopy(clientId);
      return;
    } catch (error) {
      if (controller.signal.aborted || !retryPause) break;
      await pause(retryPause);
    }
  }
  dispatch(transferEnded(clientId));
  dispatch(markUploadFailed(clientId));
});

export const RetryUpload = (clientId) => (dispatch) => {
  dispatch(clearUploadFailed(clientId));
  dispatch(UploadAttachment(clientId));
};

// ------------- Remove An Attachment That Did Not Upload -------------
export const RemoveUnsentAttachment = (message) => async (dispatch) => {
  try {
    await axios.delete(`/message/${message._id}`);
    dispatch(removeMessage(message));
    dispatch(clearUploadFailed(message.clientId));
    releaseAttachment(message.clientId);
  } catch (error) {
    notifyError(error);
  }
};
