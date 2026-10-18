import { cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import createHttpError from "http-errors";

import ChatPreferenceModel from "#src/models/chatPreferenceModel.js";
import SessionModel from "#src/models/sessionModel.js";
import { memberRooms } from "#src/services/conversationService.js";

const LONGEST_TOKEN = 4096;
const MOST_PER_SEND = 500;
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

// the message itself is end-to-end encrypted, so a push can only say who wrote, never what
const noticeOf = (conversation, sender) =>
  conversation.isGroup
    ? { title: conversation.name, body: `${sender.firstName}: New message` }
    : { title: `${sender.firstName} ${sender.lastName}`, body: "New message" };

export const pushNewMessage = async (conversation, sender) => {
  const sendable = messagingOrNull();
  if (!sendable) return;

  const sessions = await SessionModel.find({ user: { $in: await unmutedRecipients(conversation, sender._id) }, pushToken: { $exists: true } }).select("pushToken");
  if (!sessions.length) return;

  const conversationId = String(conversation._id);
  const stale = [];

  // Firebase refuses more than five hundred tokens in one call, which a full group of busy people can reach
  for (let start = 0; start < sessions.length; start += MOST_PER_SEND) {
    const batch = sessions.slice(start, start + MOST_PER_SEND);
    const { responses } = await sendable.sendEachForMulticast({
      tokens: batch.map((session) => session.pushToken),
      notification: noticeOf(conversation, sender),
      data: { conversationId },
      android: { collapseKey: conversationId, notification: { tag: conversationId } },
    });
    batch.forEach((session, position) => {
      if (STALE_TOKEN.has(responses[position].error?.code)) stale.push(session._id);
    });
  }

  if (stale.length) await SessionModel.updateMany({ _id: { $in: stale } }, { $unset: { pushToken: 1 } });
};
