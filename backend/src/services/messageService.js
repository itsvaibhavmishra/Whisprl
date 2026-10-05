import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "../models/index.js";
import { MEMBER_FIELDS, findMemberConversation } from "./conversationService.js";
import { uploadFile } from "./fileUploadService.js";
import { currentKeyIdOf, isSealed } from "./keyService.js";

const MAX_CIPHER_LENGTH = 64 * 1024;

// validate friendship before sending message
const validateFriendship = async (sender_id, receiver_id) => {
  const mutualFriends = await UserModel.countDocuments({
    $or: [
      { _id: sender_id, friends: receiver_id },
      { _id: receiver_id, friends: sender_id },
    ],
  });

  if (mutualFriends < 2) {
    throw createHttpError.Forbidden("You are no longer friends with this user");
  }
};

export const findSendableConversation = async (convo_id, user_id) => {
  const conversation = await findMemberConversation(convo_id, user_id);
  const receiver_id = conversation.users.find((member) => !member.equals(user_id));

  await Promise.all([
    receiver_id && validateFriendship(user_id, receiver_id),
    conversation.populate("users", MEMBER_FIELDS),
  ]);

  return conversation;
};

const senderOf = (conversation, sender_id) => conversation.users.find((member) => member._id.equals(sender_id));

const peerOf = (conversation, sender_id) =>
  conversation.users.find((member) => !member._id.equals(sender_id)) ?? senderOf(conversation, sender_id);

export const peerHasKey = (conversation, sender_id) => Boolean(currentKeyIdOf(peerOf(conversation, sender_id)));

// both members' current keys, or the sender's twice while the friend has none, so nobody gets a message they cannot open
export const validateCipher = (cipher, conversation, sender_id) => {
  if (!isSealed(cipher, MAX_CIPHER_LENGTH) || !Array.isArray(cipher.keyIds)) {
    throw createHttpError.BadRequest("Messages must be encrypted. Reload Whisprl to get the latest version.");
  }

  const senderKeyId = currentKeyIdOf(senderOf(conversation, sender_id));
  const expected = [senderKeyId, currentKeyIdOf(peerOf(conversation, sender_id)) ?? senderKeyId];

  if (!senderKeyId || cipher.keyIds.length !== 2 || cipher.keyIds.some((keyId, index) => keyId !== expected[index])) {
    throw createHttpError.Conflict("Encryption keys changed. Reload Whisprl to keep chatting.");
  }
};

export const isClientId = (clientId) => typeof clientId === "string" && /^[\w-]{8,64}$/.test(clientId);

// an encrypted file is unreadable here, so only its size is checked; its type was checked by the browser that chose it
export const MAX_SEALED_FILE_SIZE = 5 * 1024 * 1024 + 1024;

export const batchOf = ({ batchId, batchIndex, batchTotal } = {}) =>
  isClientId(batchId) && Number.isInteger(batchIndex) && Number.isInteger(batchTotal) ? { batchId, batchIndex, batchTotal } : {};

const SENDER_FIELDS = ["_id", "firstName", "lastName", "avatar"];

const senderSummaryOf = (member) => Object.fromEntries(SENDER_FIELDS.map((field) => [field, member[field]]));

const toClientMessage = (message, conversation) => ({
  ...message.toObject(),
  sender: senderSummaryOf(senderOf(conversation, message.sender)),
});

const findSentMessage = (sender_id, clientId) =>
  isClientId(clientId) ? MessageModel.findOne({ sender: sender_id, clientId }) : null;

// takes the conversation with its members loaded, so the reply needs no further queries
export const saveMessage = async (conversation, msgData) => {
  const message = new MessageModel({ ...msgData, conversation: conversation._id });

  try {
    await message.save();
  } catch (error) {
    if (error.code !== 11000) throw error;
    // a resend of a message already saved, so the saved copy is the answer
    const original = await findSentMessage(msgData.sender, msgData.clientId);
    return { message: toClientMessage(original, conversation), isNew: false };
  }

  // only ever moves forward, so two members sending at once cannot leave the older message as the preview
  await ConversationModel.updateOne(
    { _id: conversation._id, $or: [{ latestMessage: null }, { latestMessage: { $lt: message._id } }] },
    { latestMessage: message._id }
  );
  return { message: toClientMessage(message, conversation), isNew: true };
};

export const findDeliverableMessages = async (user_id) => {
  const messages = await MessageModel.find({ sender: user_id, awaitingKey: true }).populate({
    path: "conversation",
    populate: { path: "users", select: MEMBER_FIELDS },
  });

  return messages.filter((message) => message.conversation && peerHasKey(message.conversation, user_id));
};

export const resealMessage = async (message_id, user_id, cipher) => {
  const message = mongoose.isValidObjectId(message_id)
    ? await MessageModel.findOne({ _id: message_id, sender: user_id, awaitingKey: true })
    : null;

  if (!message) {
    throw createHttpError.NotFound("Message does not exist");
  }

  const conversation = await findSendableConversation(message.conversation, user_id);
  if (!peerHasKey(conversation, user_id)) {
    throw createHttpError.Conflict("Your friend has no key yet");
  }
  validateCipher(cipher, conversation, user_id);

  message.cipher = cipher;
  message.awaitingKey = false;
  await message.save();

  return { conversation, message: toClientMessage(message, conversation) };
};

const fromOthers = (conversation_ids, reader_id) => ({
  conversation: { $in: conversation_ids },
  sender: { $ne: reader_id },
  awaitingKey: { $ne: true },
});

export const markDelivered = async (conversation_ids, reader_id) => {
  const undelivered = await MessageModel.find({ ...fromOthers(conversation_ids, reader_id), deliveredAt: null }).select(
    "conversation"
  );
  if (!undelivered.length) return [];

  await MessageModel.updateMany({ _id: { $in: undelivered.map(({ _id }) => _id) } }, { deliveredAt: new Date() });
  return [...new Set(undelivered.map(({ conversation }) => String(conversation)))];
};

export const markSeen = async (conversation_id, reader_id) => {
  const now = new Date();
  const { modifiedCount } = await MessageModel.updateMany(
    { ...fromOthers([conversation_id], reader_id), seenAt: null },
    [{ $set: { seenAt: now, deliveredAt: { $ifNull: ["$deliveredAt", now] } } }]
  );
  return modifiedCount > 0;
};

const ownAttachmentMessage = (message_id, user_id, filter = {}) =>
  mongoose.isValidObjectId(message_id)
    ? MessageModel.findOne({ _id: message_id, sender: user_id, attachment: { $exists: true }, ...filter })
    : null;

// a retried upload of a file already attached answers with the message as it is
export const attachSealedFile = async (message_id, user_id, file) => {
  const message = await ownAttachmentMessage(message_id, user_id);
  if (!message) throw createHttpError.NotFound("Message does not exist");
  const conversation = await findSendableConversation(message.conversation, user_id);

  if (message.attachment.status === "uploading") {
    if (!file) throw createHttpError.BadRequest("Attach the file to upload");
    const url = await uploadFile(`Chat Files/${conversation._id}`, { buffer: file.buffer, mimetype: "application/octet-stream" });
    message.attachment = { url, size: file.size, status: "ready" };
    await message.save();
  }

  return { conversation, message: toClientMessage(message, conversation) };
};

// only a message whose file never arrived can go, so nothing anyone has seen disappears
export const removeUnsentAttachment = async (message_id, user_id) => {
  const message = await ownAttachmentMessage(message_id, user_id, { "attachment.status": "uploading" });
  if (!message) throw createHttpError.NotFound("Message does not exist");

  const conversation = await findMemberConversation(message.conversation, user_id);
  await message.deleteOne();
  const newest = await MessageModel.findOne({ conversation: conversation._id }).sort({ _id: -1 }).select("_id");
  await ConversationModel.updateOne({ _id: conversation._id, latestMessage: message._id }, { latestMessage: newest?._id ?? null });

  return { conversation, message };
};

const PAGE_SIZE = 50;

export const getConvoMessages = async (convo_id, before) => {
  const olderThan = mongoose.isValidObjectId(before) ? { _id: { $lt: before } } : {};
  const page = await MessageModel.find({ conversation: convo_id, ...olderThan })
    .sort({ _id: -1 })
    .limit(PAGE_SIZE + 1)
    .populate("sender", SENDER_FIELDS.join(" "));

  return { messages: page.slice(0, PAGE_SIZE).reverse(), hasMore: page.length > PAGE_SIZE };
};
