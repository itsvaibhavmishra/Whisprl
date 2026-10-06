import createHttpError from "http-errors";
import mongoose from "mongoose";

import { MessageModel } from "#src/models/index.js";
import { findMemberConversation, populateMembers } from "#src/services/conversationService.js";
import { deleteFile, isCloudinaryFile } from "#src/services/fileUploadService.js";
import {
  findSendableConversation,
  removeUnsentAttachment,
  toClientMessage,
  validateCipher,
  withQuote,
} from "#src/services/messageService.js";

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const STANDING = { deletedAt: null, event: { $exists: false } };

const findMessage = async (message_id, filter) => {
  const message = mongoose.isValidObjectId(message_id) ? await MessageModel.findOne({ _id: message_id, ...filter }) : null;
  if (!message) throw createHttpError.NotFound("Message does not exist");
  return message;
};

const answer = async (message, conversation) => ({ conversation, message: toClientMessage(await withQuote(message), conversation) });

export const editMessage = async (message_id, user_id, cipher) => {
  const message = await findMessage(message_id, { ...STANDING, sender: user_id, attachment: { $exists: false } });
  if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
    throw createHttpError.Forbidden("A message can be edited for 15 minutes after it is sent");
  }

  const conversation = await findSendableConversation(message.conversation, user_id);
  validateCipher(cipher, conversation, user_id);
  message.set({ cipher, editedAt: new Date() });
  await message.save();
  return answer(message, conversation);
};

// a forwarded copy shares the encrypted file, so the file goes only once nothing points at it
const deleteFilesNoLongerUsed = async (urls) => {
  const unused = [];
  for (const url of urls.filter(isCloudinaryFile)) {
    if (!(await MessageModel.exists({ $or: [{ "attachment.url": url }, { "files.url": url }] }))) unused.push(url);
  }
  await Promise.allSettled(unused.map((url) => deleteFile(url)));
};

// a file that never finished uploading was never seen, so its message goes entirely
export const deleteForEveryone = async (message_id, user_id) => {
  const message = await findMessage(message_id, { ...STANDING, sender: user_id });
  if (message.attachment?.status === "uploading") return { ...(await removeUnsentAttachment(message_id, user_id)), isGone: true };

  const conversation = await populateMembers(await findMemberConversation(message.conversation, user_id));
  const fileUrls = [message.attachment?.url, ...message.files.map((file) => file.url)].filter(Boolean);

  message.set({ cipher: undefined, message: undefined, attachment: undefined, files: [], reactions: [], deletedAt: new Date() });
  await message.save();

  const wasPinned = conversation.pins.some((pin) => pin.message.equals(message._id));
  if (wasPinned) {
    conversation.pins = conversation.pins.filter((pin) => !pin.message.equals(message._id));
    await conversation.save();
  }
  await deleteFilesNoLongerUsed(fileUrls);
  return { ...(await answer(message, conversation)), isGone: false, wasPinned };
};

export const hideForMe = async (message_id, user_id) => {
  const message = await findMessage(message_id, {});
  await findMemberConversation(message.conversation, user_id);
  await MessageModel.updateOne({ _id: message._id }, { $addToSet: { hiddenFor: user_id } });
  return { _id: message._id, conversation: message.conversation };
};

// one reaction per person, so reacting again replaces it and no cipher takes it away
export const setReaction = async (message_id, user_id, cipher) => {
  const message = await findMessage(message_id, STANDING);
  const conversation = await findSendableConversation(message.conversation, user_id);
  if (cipher) validateCipher(cipher, conversation, user_id);

  await MessageModel.updateOne({ _id: message._id }, { $pull: { reactions: { user: user_id } } });
  if (cipher) await MessageModel.updateOne({ _id: message._id }, { $push: { reactions: { user: user_id, cipher } } });

  return answer(await MessageModel.findById(message._id), conversation);
};
