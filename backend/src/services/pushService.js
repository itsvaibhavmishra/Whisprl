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

const unmutedRecipients = async (conversation, senderId) => {
  const recipients = memberRooms(conversation, senderId);
  const muted = await ChatPreferenceModel.find({ conversation: conversation._id, user: { $in: recipients }, mutedUntil: { $gt: new Date() } }).distinct("user");
  const mutedIds = new Set(muted.map(String));
  return recipients.filter((userId) => !mutedIds.has(userId));
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
    kind: kindOf(message),
    keyId,
    senderPublicKey,
    cipherIv: cipher.iv,
    cipherData: cipher.data,
    ...(sealedKey && { sealedIv: sealedKey.iv, sealedData: sealedKey.data }),
  };
};

export const pushDataFor = (conversation, sender, message, recipientId, keyId) => {
  const named = {
    conversationId: String(conversation._id),
    recipientId,
    senderId: String(sender._id),
    title: conversation.isGroup ? conversation.name : `${sender.firstName} ${sender.lastName}`,
    ...(conversation.isGroup && { sender: sender.firstName }),
  };
  const sealed = { ...named, ...sealedFor(message, sender, keyId) };
  return Buffer.byteLength(JSON.stringify(sealed)) <= MOST_DATA_BYTES ? sealed : named;
};

const pushSessionsFor = async (conversation, senderId) =>
  SessionModel.find({ user: { $in: await unmutedRecipients(conversation, senderId) }, pushToken: { $exists: true } }).select("user pushToken");

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
  const sessions = await pushSessionsFor(conversation, sender._id);
  if (!sessions.length) return;

  const keyIds = await currentKeyIdsOf(sessions.map((session) => session.user));
  const pushes = sessions.map((session) => {
    const recipientId = String(session.user);
    return pushTo(session, conversation, pushDataFor(conversation, sender, message, recipientId, keyIds.get(recipientId)));
  });
  await sendAll(sendable, sessions, pushes);
};

// an invite carries nothing secret, so its words travel as they are
export const pushGameInvite = async (conversation, sender, gameName) => {
  const sendable = messagingOrNull();
  if (!sendable) return;
  const sessions = await pushSessionsFor(conversation, sender._id);
  const data = {
    conversationId: String(conversation._id),
    senderId: String(sender._id),
    title: `${sender.firstName} ${sender.lastName}`,
    text: `Wants to play ${gameName}`,
  };
  await sendAll(
    sendable,
    sessions,
    sessions.map((session) => pushTo(session, conversation, { ...data, recipientId: String(session.user) }))
  );
};
