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
  updateQueuedMessage,
} from "@/redux/slices/chatSlice";
import {
  ATTACHMENT_TYPES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENT_SIZE,
  attachmentFile,
  dropSealedCopy,
  holdAttachment,
  keepSealedCopy,
  pickFiles,
  prepareImage,
  releaseAttachment,
  sealedCopyOf,
  sentMessageIdOf,
} from "@/utils/attachments";
import axios from "@/utils/axios";
import { sealFile } from "@/utils/crypto/fileCipher";
import { notify, notifyError } from "@/utils/notify";
import uuidv4 from "@/utils/uuidv4";

const UPLOAD_PAUSES = [2000, 5000];

const typeLabelOf = (kind, file) =>
  (kind === "image" ? file.type.split("/")[1] : file.name.split(".").pop()).toUpperCase();

const signatureOf = (file) => `${file.name}:${file.size}:${file.lastModified}`;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    fresh.map(async (file) => ({
      signature: signatureOf(file),
      ...(kindInUse === "image" ? await prepareImage(file) : { file }),
    }))
  );
  const accepted = ready.filter(({ file }) => file.size <= MAX_ATTACHMENT_SIZE || refused(`${file.name} is larger than 5 MB`));

  const room = MAX_ATTACHMENTS - getState().chat.files.length;
  if (accepted.length > room) refused(`Maximum ${MAX_ATTACHMENTS} files allowed per message`);

  accepted.slice(0, room).forEach(({ file, signature, width, height, preview }) =>
    dispatch(
      addFiles({
        id: holdAttachment(file),
        kind: kindInUse,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        typeLabel: typeLabelOf(kindInUse, file),
        signature,
        width,
        height,
        preview,
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

const detailsOf = ({ fileName, mimeType, size, width, height, preview, kind }) => ({
  name: fileName,
  mimeType,
  size,
  width,
  height,
  preview,
  kind: kind === "image" ? "image" : "document",
});

const sealedKeyOf = async (attachment) => {
  const { data, key, iv } = await sealFile(await attachmentFile(attachment.id).arrayBuffer());
  keepSealedCopy(attachment.id, data);
  return { key, iv };
};

// ------------- Send Chosen Attachments -------------
// images go as one captioned group; a single document carries the caption itself
export const SendAttachments = (caption) => async (dispatch, getState) => {
  const { files, activeConversation, messages } = getState().chat;
  if (!files.length) return;
  dispatch(clearFiles());

  const isImages = files[0].kind === "image";
  const captionFor = (index) => ((isImages && index === 0) || (!isImages && files.length === 1) ? caption : undefined);
  const batchId = uuidv4();
  const details = files.map(detailsOf);

  // queued before encrypting, so a message typed straight after can never overtake the files
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
        file: details[index],
        batch: { batchId, batchIndex: index, batchTotal: files.length },
      })
    )
  );

  const keys = await Promise.all(files.map(sealedKeyOf));
  files.forEach((attachment, index) =>
    dispatch(updateQueuedMessage({ clientId: attachment.id, status: "sending", file: { ...details[index], ...keys[index] } }))
  );
  dispatch(FlushOutbox());
};

// ------------- Upload An Attachment's File -------------
export const UploadAttachment = createAsyncThunk("message/upload-attachment", async (clientId, { dispatch }) => {
  const form = new FormData();
  form.append("file", sealedCopyOf(clientId));

  for (const retryPause of [...UPLOAD_PAUSES, null]) {
    try {
      const { data } = await axios.post(`/message/${sentMessageIdOf(clientId)}/attachment`, form);
      dispatch(clearUploadFailed(clientId));
      await dispatch(ReceiveMessageUpdate(data.message));
      dropSealedCopy(clientId);
      return;
    } catch (error) {
      if (!retryPause) break;
      await pause(retryPause);
    }
  }
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
