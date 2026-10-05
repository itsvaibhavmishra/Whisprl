import { createAsyncThunk } from "@reduxjs/toolkit";

import {
  addFiles,
  clearFiles,
  dropQueuedMessage,
  messageArrived,
  queueMessage,
  removeFile,
  requeueMessage,
  updateQueuedMessage,
} from "@/redux/slices/chatSlice";
import {
  ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  attachmentFile,
  holdAttachment,
  pickFiles,
  releaseAttachment,
  shrinkImage,
} from "@/utils/attachments";
import axios from "@/utils/axios";
import { errorMessageOf, notify, notifyError } from "@/utils/notify";
import uuidv4 from "@/utils/uuidv4";

const uploadsInFlight = new Map();

const typeLabelOf = (kind, file) =>
  (kind === "image" ? file.type.split("/")[1] : file.name.split(".").pop()).toUpperCase();

const signatureOf = (file) => `${file.name}:${file.size}:${file.lastModified}`;

// ------------- Choose Attachments -------------
export const ChooseAttachments = (kind) => async (dispatch, getState) => {
  const chosen = getState().chat.files;
  const kindInUse = chosen[0]?.kind ?? kind;
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
    fresh.map(async (file) => ({ signature: signatureOf(file), file: kindInUse === "image" ? await shrinkImage(file) : file }))
  );
  const accepted = ready.filter(({ file }) => file.size <= MAX_ATTACHMENT_SIZE || refused(`${file.name} is larger than 5 MB`));

  const room = MAX_ATTACHMENTS - getState().chat.files.length;
  if (accepted.length > room) refused(`Maximum ${MAX_ATTACHMENTS} files allowed per message`);

  accepted.slice(0, room).forEach(({ file, signature }) =>
    dispatch(
      addFiles({
        id: holdAttachment(file),
        kind: kindInUse,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        typeLabel: typeLabelOf(kindInUse, file),
        signature,
      })
    )
  );
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

// ------------- Upload One Attachment -------------
export const UploadAttachment = createAsyncThunk("message/upload-attachment", async (entry, { dispatch }) => {
  const controller = new AbortController();
  uploadsInFlight.set(entry.clientId, controller);

  const formData = new FormData();
  formData.append("file", attachmentFile(entry.attachment.id));
  formData.append("convo_id", entry.conversationId);
  formData.append("clientId", entry.clientId);
  if (entry.caption) formData.append("message", entry.caption);
  if (entry.batch) Object.entries(entry.batch).forEach(([field, value]) => formData.append(field, value));

  try {
    const { data } = await axios.post("/message/send-message", formData, { signal: controller.signal });
    dispatch(messageArrived(data.message));
    releaseAttachment(entry.attachment.id);
  } catch (error) {
    if (controller.signal.aborted) return;
    dispatch(updateQueuedMessage({ clientId: entry.clientId, status: "failed", error: errorMessageOf(error) }));
    notifyError(error);
  } finally {
    uploadsInFlight.delete(entry.clientId);
  }
});

// ------------- Send Chosen Attachments -------------
// images go as one captioned group; a single document carries the caption itself
export const SendAttachments = (caption) => (dispatch, getState) => {
  const { files, activeConversation, messages } = getState().chat;
  if (!files.length) return;

  const batchId = uuidv4();
  const isImages = files[0].kind === "image";
  const captionFor = (index) => ((isImages && index === 0) || (!isImages && files.length === 1) ? caption : undefined);

  const senderId = getState().user.user._id;
  const entries = files.map((attachment, index) => ({
    clientId: uuidv4(),
    senderId,
    conversationId: activeConversation._id,
    afterId: messages.at(-1)?._id,
    createdAt: new Date().toISOString(),
    attachment,
    caption: captionFor(index),
    batch: { batchId, batchIndex: index, batchTotal: files.length },
  }));

  dispatch(clearFiles());
  entries.forEach((entry) => {
    dispatch(queueMessage(entry));
    dispatch(UploadAttachment(entry));
  });
};

// ------------- Retry, Cancel -------------
export const RetryAttachment = (entry) => (dispatch, getState) => {
  dispatch(requeueMessage(entry.clientId));
  dispatch(UploadAttachment(getState().chat.outbox.find((queued) => queued.clientId === entry.clientId)));
};

export const CancelAttachment = (entry) => (dispatch) => {
  uploadsInFlight.get(entry.clientId)?.abort();
  releaseAttachment(entry.attachment.id);
  dispatch(dropQueuedMessage(entry.clientId));
};
