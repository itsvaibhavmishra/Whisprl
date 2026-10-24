import { createAsyncThunk } from "@reduxjs/toolkit";

import { FlushOutbox, ReceiveMessageUpdate, quoteOf } from "@/redux/slices/actions/chatActions";
import {
  addFiles,
  clearFiles,
  clearUploadFailed,
  markUploadFailed,
  queueMessage,
  removeFile,
  removeMessage,
  setReplyingTo,
  transferEnded,
  transferProgress,
  updateFile,
  updateQueuedMessage,
} from "@/redux/slices/chatSlice";
import {
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  MEDIA_TYPES,
  attachmentFile,
  cancelTransfer,
  dropSealedCopy,
  holdAttachment,
  isCurrentTransfer,
  keepSealedCopy,
  originalFileOf,
  pickFiles,
  readImage,
  releaseAttachment,
  replaceHeldFile,
  replaceWithEdited,
  sealedCopyOf,
  sentMessageIdOf,
  shrinkImage,
  startTransfer,
  wholePercents,
} from "@/utils/attachments";
import axios from "@/utils/axios";
import { sealFile } from "@/utils/crypto/fileCipher";
import { hasEdits, renderPhoto, videoOverlayOf } from "@/utils/media-editor/render";
import { notify, notifyError } from "@/utils/notify";
import { playQueuedSound } from "@/utils/sounds";
import { COMPRESS_SHARE, VideoRefusal, compressVideo, probeVideo } from "@/utils/video";
import { completeVoiceFile } from "@/utils/voice";
import { feel } from "@/utils/haptics";
import uuidv4 from "@/utils/uuidv4";

const UPLOAD_PAUSES = [2000, 5000];

const kindOf = (file) => {
  if (file.type.startsWith("image/")) return "image";
  return file.type.startsWith("video/") ? "video" : "doc";
};

const typeLabelOf = (kind, file) => {
  if (kind === "image") return file.type.split("/")[1].toUpperCase();
  return kind === "video" ? "VIDEO" : file.name.split(".").pop().toUpperCase();
};

const groupOf = (chosenFile) => (chosenFile.kind === "doc" ? "doc" : "media");

const PICKED_DETAILS = ["fileName", "mimeType", "size", "typeLabel", "preview"];

const signatureOf = (file) => `${file.name}:${file.size}:${file.lastModified}`;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// anything can be sent as a document, a photo included, so a document is never shown as media
const pickedKindOf = (file, group) => (group === "doc" ? "doc" : kindOf(file));

// a photo or video is made smaller when sent, so only a file sent as it is has to fit the limit now
const isShrunkWhenSent = (file, kind) => kind === "video" || (kind === "image" && file.type !== "image/gif");

const progressReporter = (dispatch, clientId, from, to) => {
  const report = wholePercents((percent) => dispatch(transferProgress({ clientId, percent })));
  return (fraction) => report(from + fraction * (to - from));
};

// read once it shows, so a large photo or video appears at once and only Send waits for its size and preview
const ReadAttachment = (id, kind) => async (dispatch, getState) => {
  const file = attachmentFile(id);
  try {
    const { width, height, preview, duration } = kind === "image" ? await readImage(file) : await probeVideo(file);
    dispatch(updateFile({ id, width, height, preview, duration, isReading: false }));
  } catch (error) {
    if (!getState().chat.files.some((chosen) => chosen.id === id)) return;
    dispatch(RemoveAttachment(id));
    notify({ severity: "info", message: error instanceof VideoRefusal ? error.message : `${file.name} could not be opened` });
  }
};

export const ChooseAttachments = (kind) => async (dispatch, getState) => {
  const chosen = getState().chat.files;
  const kindInUse = chosen.length ? groupOf(chosen[0]) : kind;
  if (chosen.length >= MAX_ATTACHMENTS) {
    notify({ severity: "info", message: `Maximum ${MAX_ATTACHMENTS} files allowed per message` });
    return;
  }

  const picked = await pickFiles(kindInUse === "doc" ? [] : MEDIA_TYPES);
  const known = new Set(getState().chat.files.map((file) => file.signature));
  const refused = (message) => {
    notify({ severity: "info", message });
    return false;
  };

  const fresh = picked.filter((file) => {
    if (kindInUse === "media" && !MEDIA_TYPES.includes(file.type)) return refused(`${file.name} is not a file type Whisprl can send`);
    if (!isShrunkWhenSent(file, pickedKindOf(file, kindInUse)) && file.size > MAX_ATTACHMENT_SIZE) return refused(`${file.name} is larger than 5 MB`);
    return !known.has(signatureOf(file));
  });

  const room = MAX_ATTACHMENTS - getState().chat.files.length;
  if (fresh.length > room) refused(`Maximum ${MAX_ATTACHMENTS} files allowed per message`);

  fresh.slice(0, room).forEach((file) => {
    const fileKind = pickedKindOf(file, kindInUse);
    const id = holdAttachment(file);
    dispatch(
      addFiles({
        id,
        kind: fileKind,
        fileName: file.name,
        // the server needs a type, and a file the phone does not recognise arrives with none
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        typeLabel: typeLabelOf(fileKind, file),
        signature: signatureOf(file),
        isReading: fileKind !== "doc",
      })
    );
    if (fileKind !== "doc") dispatch(ReadAttachment(id, fileKind));
  });
};

// a photo is redrawn at once so every preview shows the edit; a video is drawn on while it compresses
export const EditAttachment = (id, edits) => async (dispatch, getState) => {
  const chosen = getState().chat.files.find((file) => file.id === id);
  if (chosen?.kind !== "image") return dispatch(updateFile({ id, edits }));
  // kept from the first edit, so taking every edit back off returns the photo exactly as it was picked
  const asPicked = chosen.asPicked ?? Object.fromEntries(PICKED_DETAILS.map((key) => [key, chosen[key]]));
  if (!hasEdits(edits)) {
    replaceHeldFile(id, originalFileOf(id));
    return dispatch(updateFile({ id, edits: undefined, ...asPicked }));
  }
  try {
    const edited = await renderPhoto({ file: originalFileOf(id), edits });
    replaceWithEdited(id, edited.file);
    const { name, type, size } = edited.file;
    dispatch(updateFile({ id, edits, asPicked, fileName: name, mimeType: type, size, preview: edited.preview, typeLabel: typeLabelOf("image", edited.file) }));
  } catch {
    notify({ severity: "error", message: "This photo could not be edited" });
  }
};

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
    if (file.kind === "image") {
      const shrunk = await shrinkImage(attachmentFile(clientId));
      if (shrunk !== attachmentFile(clientId)) replaceHeldFile(clientId, shrunk);
      file = { ...file, name: shrunk.name, mimeType: shrunk.type, size: shrunk.size };
    }
    if (file.kind === "video") {
      const report = progressReporter(dispatch, clientId, 0, COMPRESS_SHARE);
      const overlay = videoOverlayOf(entry.edits);
      const shrunk = await compressVideo(attachmentFile(clientId), { duration: file.duration, onProgress: report, signal: controller.signal, overlay });
      replaceHeldFile(clientId, shrunk.file);
      // the held video now carries its drawing, so sending it again must not draw it a second time
      dispatch(updateQueuedMessage({ clientId, edits: undefined }));
      file = {
        ...file,
        name: shrunk.file.name,
        mimeType: shrunk.file.type,
        size: shrunk.file.size,
        width: shrunk.width ?? file.width,
        height: shrunk.height ?? file.height,
      };
      // a view-once video goes without a poster, so the drawn one only replaces a poster already there
      if (file.preview && shrunk.preview) file.preview = shrunk.preview;
    }
    if (file.kind === "voice") {
      const complete = await completeVoiceFile(attachmentFile(clientId));
      replaceHeldFile(clientId, complete);
      file = { ...file, mimeType: complete.type, size: complete.size };
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

// photos and videos go as one captioned group; a single document carries the caption itself
export const SendAttachments =
  (caption, isViewOnce = false) =>
  async (dispatch, getState) => {
    const { files, activeConversation, messages } = getState().chat;
    if (!files.length || files.some((file) => file.isReading)) return;
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
          // kept beside the file rather than in it, since the file's details are what the message carries
          ...(attachment.kind === "video" && { edits: attachment.edits }),
        })
      )
    );

    playQueuedSound();
    feel();

    // one at a time, so the files ahead in the group are not slowed by a video being compressed behind them
    for (const attachment of files) await dispatch(PrepareQueued(attachment.id));
  };

export const SendVoiceMessage =
  ({ file, duration, waveform }) =>
  (dispatch, getState) => {
    const { activeConversation, messages, replyingTo } = getState().chat;
    const clientId = holdAttachment(file);
    dispatch(
      queueMessage({
        clientId,
        status: "preparing",
        senderId: getState().user.user._id,
        conversationId: activeConversation._id,
        afterId: messages.at(-1)?._id,
        createdAt: new Date().toISOString(),
        file: { name: "Voice message", mimeType: file.type, size: file.size, duration, waveform, kind: "voice" },
        replyTo: quoteOf(replyingTo),
      })
    );
    if (replyingTo) dispatch(setReplyingTo(null));
    playQueuedSound();
    feel();
    dispatch(PrepareQueued(clientId));
  };

// a file still waiting its turn has nothing running to stop, so it is simply marked as not sent
export const CancelTransfer = (clientId) => (dispatch, getState) => {
  if (cancelTransfer(clientId)) return;
  const isWaiting = getState().chat.outbox.some((queued) => queued.clientId === clientId && queued.status === "preparing");
  if (isWaiting) dispatch(updateQueuedMessage({ clientId, status: "failed", error: null }));
  dispatch(transferEnded(clientId));
};

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
    } catch {
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
