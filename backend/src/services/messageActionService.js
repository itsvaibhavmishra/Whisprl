import createHttpError from "http-errors";
import mongoose from "mongoose";

import { MessageModel } from "#src/models/index.js";
import { findMemberConversation, memberRooms, populateMembers } from "#src/services/conversationService.js";
import {
  deleteFilesNoLongerUsed,
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
  const conversation = await findMemberConversation(message.conversation, user_id);
  const hidden = await MessageModel.findOneAndUpdate({ _id: message._id }, { $addToSet: { hiddenFor: user_id } }, { new: true });
  await deleteFileOnceSeen(hidden, conversation);
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

// sent to the members there at the time, less anyone who has since deleted it for themselves
const recipientsOf = (message, conversation) =>
  memberRooms(conversation, message.sender).filter((member) => {
    const joinedAt = conversation.joinedAt?.get(member);
    return (!joinedAt || joinedAt <= message.createdAt) && !message.hiddenFor.some((userId) => userId.equals(member));
  });

const deleteFileOnceSeen = async (message, conversation) => {
  if (!message.viewOnce || !message.attachment?.url) return;
  const viewers = new Set(message.viewedBy.map(String));
  if (!recipientsOf(message, conversation).every((member) => viewers.has(member))) return;

  const { url } = message.attachment;
  message.attachment = { status: "opened" };
  await message.save();
  await deleteFilesNoLongerUsed([url]);
};

// recorded in one write, so two members opening it at once cannot lose each other's view
export const markOpened = async (message_id, user_id) => {
  const message = await findMessage(message_id, { ...STANDING, viewOnce: true, sender: { $ne: user_id } });
  const conversation = await populateMembers(await findMemberConversation(message.conversation, user_id));
  const opened = await MessageModel.findOneAndUpdate(
    { _id: message._id, viewedBy: { $ne: user_id } },
    { $addToSet: { viewedBy: user_id } },
    { new: true }
  );
  if (!opened) throw createHttpError.Gone("You have already opened this photo");

  await deleteFileOnceSeen(opened, conversation);
  return answer(opened, conversation);
};
