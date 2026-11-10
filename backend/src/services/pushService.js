import { cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import createHttpError from "http-errors";

import ChatPreferenceModel from "#src/models/chatPreferenceModel.js";
import SessionModel from "#src/models/sessionModel.js";
import UserModel from "#src/models/userModel.js";
import { memberRooms } from "#src/services/conversationService.js";

const LONGEST_TOKEN = 4096;
const MOST_PER_SEND = 500;
// Firebase refuses a push whose data passes four kilobytes, so a longer message goes without its words
const MOST_DATA_BYTES = 3800;
const STALE_TOKEN = new Set(["messaging/registration-token-not-registered", "messaging/invalid-registration-token"]);

let messaging;

// made on first use rather than at import, so a server without Firebase set up runs, and simply sends no pushes
const messagingOrNull = () => {
  if (messaging === undefined) {
    const account = process.env.FIREBASE_SERVICE_ACCOUNT;
    messaging = account ? getMessaging(initializeApp({ credential: cert(JSON.parse(account)) })) : null;
  }
  return messaging;
};

export const saveDeviceToken = async (sessionId, token) => {
  if (typeof token !== "string" || !token || token.length > LONGEST_TOKEN) throw createHttpError.BadRequest("That device token is not valid");
  await SessionModel.updateOne({ _id: sessionId }, { pushToken: token });
};

export const forgetDeviceToken = (sessionId) => SessionModel.updateOne({ _id: sessionId }, { $unset: { pushToken: 1 } });

const unmutedRecipients = async (conversations, senderId) => {
  const muted = await ChatPreferenceModel.find({ conversation: { $in: conversations.map(({ _id }) => _id) }, mutedUntil: { $gt: new Date() } })
    .select("conversation user")
    .lean();
  const mutedPairs = new Set(muted.map(({ conversation, user }) => `${conversation}:${user}`));
  return conversations.flatMap((conversation) =>
    memberRooms(conversation, senderId)
      .filter((userId) => !mutedPairs.has(`${conversation._id}:${userId}`))
      .map((userId) => ({ userId, conversation }))
  );
};

const currentKeyIdsOf = async (userIds) => {
  const users = await UserModel.find({ _id: { $in: userIds } }).select("publicKeys");
  return new Map(users.map((user) => [String(user._id), user.publicKeys.at(-1)?.keyId]));
};

const kindOf = (message) => {
  if (message.viewOnce) return "view-once";
  return message.attachment ? "file" : "text";
};

// the ciphertext as it is stored, with only the key sealed for this recipient, so the phone can open what the server cannot
const sealedFor = (message, sender, keyId) => {
  const { cipher } = message;
  if (!cipher || !keyId) return {};
  const isGroup = Boolean(cipher.keys);
  const senderKeyId = isGroup ? cipher.senderKeyId : cipher.keyIds[0];
  const senderPublicKey = sender.publicKeys?.find((entry) => entry.keyId === senderKeyId)?.publicKey;
  const sealedKey = isGroup ? cipher.keys.find((entry) => entry.keyId === keyId) : null;
  const isForRecipient = isGroup ? Boolean(sealedKey) : cipher.keyIds[1] === keyId;
  if (!senderPublicKey || !isForRecipient) return {};

  return {
    messageId: String(message._id),
    createdAt: message.createdAt.toISOString(),
    ...(message.expiresAt && { expiresAt: message.expiresAt.toISOString() }),
    kind: kindOf(message),
    keyId,
    senderPublicKey,
    cipherIv: cipher.iv,
    cipherData: cipher.data,
    ...(sealedKey && { sealedIv: sealedKey.iv, sealedData: sealedKey.data }),
  };
};

// a group's push is titled with the group and names who it came from, a chat with one person is titled with them
const namesOf = (conversation, sender) => ({
  senderId: String(sender._id),
  title: conversation.isGroup ? conversation.name : `${sender.firstName} ${sender.lastName}`.trim(),
  ...(conversation.isGroup && { sender: sender.firstName }),
});

export const pushDataFor = (conversation, sender, message, recipientId, keyId) => {
  const named = { conversationId: String(conversation._id), recipientId, ...namesOf(conversation, sender) };
  const sealed = { ...named, ...sealedFor(message, sender, keyId) };
  return Buffer.byteLength(JSON.stringify(sealed)) <= MOST_DATA_BYTES ? sealed : named;
};

const pushTargetsFor = async (conversations, senderId) => {
  const recipients = await unmutedRecipients(conversations, senderId);
  const sessions = await SessionModel.find({ user: { $in: recipients.map(({ userId }) => userId) }, pushToken: { $exists: true } }).select("user pushToken");
  const sessionsOf = Map.groupBy(sessions, (session) => String(session.user));
  return recipients.flatMap(({ userId, conversation }) => (sessionsOf.get(userId) ?? []).map((session) => ({ session, conversation })));
};

// high priority wakes a sleeping phone, which Android allows for something its owner is then shown
const pushTo = (session, conversation, data) => ({ token: session.pushToken, data, android: { priority: "high", collapseKey: String(conversation._id) } });

const sendAll = async (sendable, sessions, pushes) => {
  const stale = [];
  // Firebase refuses more than five hundred pushes in one call, which a full group of busy people can reach
  for (let start = 0; start < pushes.length; start += MOST_PER_SEND) {
    const { responses } = await sendable.sendEach(pushes.slice(start, start + MOST_PER_SEND));
    responses.forEach((response, position) => {
      if (STALE_TOKEN.has(response.error?.code)) stale.push(sessions[start + position]._id);
    });
  }
  if (stale.length) await SessionModel.updateMany({ _id: { $in: stale } }, { $unset: { pushToken: 1 } });
};

export const pushNewMessage = async (conversation, sender, message) => {
  const sendable = messagingOrNull();
  if (!sendable) return;
  const sessions = (await pushTargetsFor([conversation], sender._id)).map(({ session }) => session);
  if (!sessions.length) return;

  const keyIds = await currentKeyIdsOf(sessions.map((session) => session.user));
  const pushes = sessions.map((session) => {
    const recipientId = String(session.user);
    return pushTo(session, conversation, pushDataFor(conversation, sender, message, recipientId, keyIds.get(recipientId)));
  });
  await sendAll(sendable, sessions, pushes);
};

// words the server writes itself, like a challenge or Whisprl's messages, carry nothing secret, so they travel as they are
export const pushWords = async (conversations, sender, text, { onlyTo } = {}) => {
  const sendable = messagingOrNull();
  if (!sendable) return;
  const everyone = await pushTargetsFor(conversations, sender._id);
  const targets = onlyTo ? everyone.filter(({ session }) => onlyTo.includes(String(session.user))) : everyone;
  const pushes = targets.map(({ session, conversation }) =>
    pushTo(session, conversation, { ...namesOf(conversation, sender), text, conversationId: String(conversation._id), recipientId: String(session.user) })
  );
  await sendAll(
    sendable,
    targets.map(({ session }) => session),
    pushes
  );
};

// news that belongs to no chat, like a friend request, opens the page it names and replaces an older push with the same tag
export const pushNotice = async (userId, { title, text, path, tag }) => {
  const sendable = messagingOrNull();
  if (!sendable) return;
  const sessions = await SessionModel.find({ user: userId, pushToken: { $exists: true } }).select("pushToken");
  const data = { title, text, path, tag };
  const pushes = sessions.map((session) => ({ token: session.pushToken, data, android: { priority: "high", collapseKey: tag } }));
  await sendAll(sendable, sessions, pushes);
};
