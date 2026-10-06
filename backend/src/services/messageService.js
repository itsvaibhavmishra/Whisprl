import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "#src/models/index.js";
import { MEMBER_FIELDS, QUOTED_FIELDS, findMemberConversation, firstIdAt, populateMembers } from "#src/services/conversationService.js";
import { blockerBetween } from "#src/services/blockService.js";
import { clearedAtFor } from "#src/services/chatPreferenceService.js";
import { deleteFile, isCloudinaryFile, uploadFile } from "#src/services/fileUploadService.js";
import { currentKeyIdOf, isSealed } from "#src/services/keyService.js";

const MAX_CIPHER_LENGTH = 64 * 1024;
const MAX_SEALED_KEY_LENGTH = 256;

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

const assertNotBlocked = async (sender_id, receiver_id) => {
  const blocker = await blockerBetween(sender_id, receiver_id);
  if (!blocker) return;
  throw createHttpError.Forbidden(blocker.equals(sender_id) ? "Unblock them to send a message" : "You can't message this person");
};

// a group's members need not all be friends; a direct chat needs the two people still to be
export const findSendableConversation = async (convo_id, user_id) => {
  const conversation = await findMemberConversation(convo_id, user_id);
  const receiver_id = !conversation.isGroup && conversation.users.find((member) => !member.equals(user_id));

  await Promise.all([
    receiver_id && validateFriendship(user_id, receiver_id),
    receiver_id && assertNotBlocked(user_id, receiver_id),
    populateMembers(conversation),
  ]);

  return conversation;
};

const senderOf = (conversation, sender_id) =>
  [...conversation.users, ...(conversation.formerUsers ?? [])].find((member) => member._id.equals(sender_id));

const peerOf = (conversation, sender_id) =>
  conversation.users.find((member) => !member._id.equals(sender_id)) ?? senderOf(conversation, sender_id);

export const peerHasKey = (conversation, sender_id) => Boolean(currentKeyIdOf(peerOf(conversation, sender_id)));

// both members' current keys, or the sender's twice while the friend has none, so nobody gets a message they cannot open
const namesBothKeys = (cipher, conversation, sender_id) => {
  const senderKeyId = currentKeyIdOf(senderOf(conversation, sender_id));
  const expected = [senderKeyId, currentKeyIdOf(peerOf(conversation, sender_id)) ?? senderKeyId];
  return Boolean(senderKeyId) && cipher.keyIds?.length === 2 && cipher.keyIds.every((keyId, index) => keyId === expected[index]);
};

// the message key sealed for exactly the current members, so nobody is left out and nobody outside can open it
const sealsForEveryMember = (cipher, conversation, sender_id) => {
  const memberKeyIds = conversation.users.map(currentKeyIdOf);
  const sealedFor = (cipher.keys ?? []).map((sealed) => sealed?.keyId);
  return (
    cipher.senderKeyId === currentKeyIdOf(senderOf(conversation, sender_id)) &&
    Array.isArray(cipher.keys) &&
    cipher.keys.every((sealed) => isSealed(sealed, MAX_SEALED_KEY_LENGTH)) &&
    sealedFor.length === memberKeyIds.length &&
    memberKeyIds.every((keyId) => keyId && sealedFor.includes(keyId))
  );
};

export const validateCipher = (cipher, conversation, sender_id) => {
  if (!isSealed(cipher, MAX_CIPHER_LENGTH)) {
    throw createHttpError.BadRequest("Messages must be encrypted. Reload Whisprl to get the latest version.");
  }

  const isSealedRight = conversation.isGroup
    ? sealsForEveryMember(cipher, conversation, sender_id)
    : namesBothKeys(cipher, conversation, sender_id);
  if (!isSealedRight) throw createHttpError.Conflict("Encryption keys changed. Reload Whisprl to keep chatting.");
};

export const isClientId = (clientId) => typeof clientId === "string" && /^[\w-]{8,64}$/.test(clientId);

// an encrypted file is unreadable here, so only its size is checked; its type was checked by the browser that chose it
export const MAX_SEALED_FILE_SIZE = 5 * 1024 * 1024 + 1024;

export const batchOf = ({ batchId, batchIndex, batchTotal } = {}) =>
  isClientId(batchId) && Number.isInteger(batchIndex) && Number.isInteger(batchTotal) ? { batchId, batchIndex, batchTotal } : {};

const SENDER_FIELDS = ["_id", "firstName", "lastName", "avatar"];

const senderSummaryOf = (member) => Object.fromEntries(SENDER_FIELDS.map((field) => [field, member[field]]));

// who hid a message is nobody else's business, so it never leaves the server
export const toClientMessage = (message, conversation) => {
  const { hiddenFor, ...visible } = message.toObject();
  return { ...visible, sender: senderSummaryOf(senderOf(conversation, message.sender)) };
};

export const withQuote = (message) => (message.replyTo ? message.populate("replyTo", QUOTED_FIELDS) : message);

// a reply must quote this chat, and a forward copies a message the sender can already read, file included
export const linksOf = async (conversation, user_id, { replyTo, forwardOf }) => {
  const links = {};
  if (replyTo && mongoose.isValidObjectId(replyTo) && (await MessageModel.exists({ _id: replyTo, conversation: conversation._id }))) {
    links.replyTo = replyTo;
  }
  if (forwardOf && mongoose.isValidObjectId(forwardOf)) {
    const original = await MessageModel.findOne({ _id: forwardOf, deletedAt: null, event: { $exists: false }, viewOnce: { $ne: true } });
    if (!original) throw createHttpError.NotFound("That message can no longer be forwarded");
    await findMemberConversation(original.conversation, user_id);
    links.forwarded = true;
    if (original.attachment?.status === "ready") links.attachment = original.attachment.toObject();
  }
  return links;
};

const findSentMessage = (sender_id, clientId) =>
  isClientId(clientId) ? MessageModel.findOne({ sender: sender_id, clientId }) : null;

// takes the conversation with its members loaded, so naming the sender needs no further query
export const saveMessage = async (conversation, msgData) => {
  const message = new MessageModel({ ...msgData, conversation: conversation._id });

  try {
    await message.save();
  } catch (error) {
    if (error.code !== 11000) throw error;
    // a resend of a message already saved, so the saved copy is the answer
    const original = await findSentMessage(msgData.sender, msgData.clientId);
    return { message: toClientMessage(await withQuote(original), conversation), isNew: false };
  }

  // only ever moves forward, so two members sending at once cannot leave the older message as the preview
  await ConversationModel.updateOne(
    { _id: conversation._id, $or: [{ latestMessage: null }, { latestMessage: { $lt: message._id } }] },
    { latestMessage: message._id }
  );
  return { message: toClientMessage(await withQuote(message), conversation), isNew: true };
};

export const saveEvent = (group, actor_id, type, { users = [], name, seconds } = {}) =>
  saveMessage(group, { sender: actor_id, event: { type, users, name, seconds } });

// a forwarded copy shares the encrypted file, so the file goes only once nothing points at it
export const deleteFilesNoLongerUsed = async (urls) => {
  const unused = [];
  for (const url of urls.filter(isCloudinaryFile)) {
    if (!(await MessageModel.exists({ $or: [{ "attachment.url": url }, { "files.url": url }] }))) unused.push(url);
  }
  await Promise.allSettled(unused.map((url) => deleteFile(url)));
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

// a group keeps one pointer per member to the newest message they have seen, instead of a mark on every message
const markGroupSeen = async ({ _id, latestMessage }, reader_id) => {
  if (!latestMessage) return null;
  const pointer = `lastSeen.${reader_id}`;
  const { modifiedCount } = await ConversationModel.updateOne({ _id, [pointer]: { $ne: latestMessage } }, { $set: { [pointer]: latestMessage } });
  return modifiedCount ? { upTo: latestMessage } : null;
};

export const markSeen = async (conversation_id, reader_id) => {
  const conversation = await ConversationModel.findById(conversation_id).select("isGroup latestMessage");
  if (conversation?.isGroup) return markGroupSeen(conversation, reader_id);

  const now = new Date();
  const { modifiedCount } = await MessageModel.updateMany(
    { ...fromOthers([conversation_id], reader_id), seenAt: null },
    [{ $set: { seenAt: now, deliveredAt: { $ifNull: ["$deliveredAt", now] } } }]
  );
  return modifiedCount ? {} : null;
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
const AROUND = PAGE_SIZE / 2;

const isId = (value) => mongoose.isValidObjectId(value);

// a reader sees from when they joined a group, since nothing earlier was sealed for them, or from when they cleared the chat
const readableBy = (conversation, reader_id, range, clearedAt) => {
  const joinedAt = conversation.isGroup && conversation.joinedAt?.get(String(reader_id));
  const readFrom = [joinedAt, clearedAt].filter(Boolean).sort((first, second) => second - first)[0];
  const ids = {
    ...range,
    ...(readFrom && { $gte: firstIdAt(readFrom) }),
  };
  return { conversation: conversation._id, hiddenFor: { $ne: reader_id }, ...(Object.keys(ids).length && { _id: ids }) };
};

const pageOf = (filter, direction, size) =>
  MessageModel.find(filter)
    .select("-hiddenFor")
    .sort({ _id: direction })
    .limit(size + 1)
    .populate("sender", SENDER_FIELDS.join(" "))
    .populate("replyTo", QUOTED_FIELDS);

// newest first by default; after a message to read on from it; around one to jump straight to it
export const getConvoMessages = async (conversation, reader_id, { before, after, around } = {}) => {
  const clearedAt = await clearedAtFor(reader_id, conversation._id);
  const readable = (range) => readableBy(conversation, reader_id, range, clearedAt);

  if (isId(around)) {
    const [older, newer] = await Promise.all([pageOf(readable({ $lte: around }), -1, AROUND), pageOf(readable({ $gt: around }), 1, AROUND)]);
    return {
      messages: [...older.slice(0, AROUND).reverse(), ...newer.slice(0, AROUND)],
      hasMore: older.length > AROUND,
      hasNewer: newer.length > AROUND,
    };
  }

  if (isId(after)) {
    const page = await pageOf(readable({ $gt: after }), 1, PAGE_SIZE);
    return { messages: page.slice(0, PAGE_SIZE), hasNewer: page.length > PAGE_SIZE };
  }

  const page = await pageOf(readable(isId(before) ? { $lt: before } : {}), -1, PAGE_SIZE);
  return { messages: page.slice(0, PAGE_SIZE).reverse(), hasMore: page.length > PAGE_SIZE };
};
