import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "../models/index.js";
import { MEMBER_FIELDS, findMemberConversation } from "./conversationService.js";
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

// validate files before uploading
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const allowedDocTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// validates a single file object
export const validateMessageFiles = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    throw createHttpError.BadRequest(
      `File "${file.originalname}" exceeds the 5MB size limit`
    );
  }

  const isImage = allowedImageTypes.includes(file.mimetype);
  const isDoc = allowedDocTypes.includes(file.mimetype);

  if (!isImage && !isDoc) {
    throw createHttpError.BadRequest(
      `File type "${file.mimetype}" is not allowed`
    );
  }
};

export const getFileType = (mimetype) => {
  return allowedImageTypes.includes(mimetype) ? "image" : "document";
};

const toClientMessage = (message, conversation) => ({
  ...message.toObject(),
  sender: senderOf(conversation, message.sender).toObject(),
});

// takes the conversation with its members loaded, so the reply needs no further queries
export const saveMessage = async (conversation, msgData) => {
  const message = new MessageModel({ ...msgData, conversation: conversation._id });

  await Promise.all([
    message.save(),
    ConversationModel.updateOne({ _id: conversation._id }, { latestMessage: message._id }),
  ]);

  const sentMessage = toClientMessage(message, conversation);
  return { ...sentMessage, conversation: { ...conversation.toObject(), latestMessage: sentMessage } };
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

// fetch all messages with conversation id
export const getConvoMessages = async (convo_id) => {
  const messages = await MessageModel.find({ conversation: convo_id })
    .populate("sender", "firstName lastName avatar email activityStatus")
    .populate("conversation");

  if (!messages) {
    throw createHttpError.BadRequest("Unable to fetch messages");
  }

  return messages;
};
