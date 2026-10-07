import createHttpError from "http-errors";

import { ConversationModel, MessageModel } from "#src/models/index.js";
import { dropEmptyAlbums } from "#src/services/albumService.js";
import { findMemberConversation, memberRooms, populateMembers } from "#src/services/conversationService.js";
import { assertManager } from "#src/services/groupService.js";
import { deleteFilesNoLongerUsed, findSendableConversation, saveEvent } from "#src/services/messageService.js";

const DAY_SECONDS = 24 * 60 * 60;
const DISAPPEAR_CHOICES = [DAY_SECONDS, 7 * DAY_SECONDS, 90 * DAY_SECONDS];
const SWEEP_BATCH = 500;

export const setDisappearing = async (conversation_id, user_id, seconds) => {
  if (seconds !== null && !DISAPPEAR_CHOICES.includes(seconds)) {
    throw createHttpError.BadRequest("Choose 24 hours, 7 days or 90 days");
  }
  const member = await findMemberConversation(conversation_id, user_id);
  if (member.isGroup) assertManager(member, user_id);
  // in a direct chat the setting posts a note, so it is open only to someone who could send a message
  const conversation = member.isGroup ? member : await findSendableConversation(conversation_id, user_id);
  if ((conversation.disappearAfter ?? null) === seconds) return { conversation, event: null };

  conversation.disappearAfter = seconds ?? undefined;
  await conversation.save();
  await populateMembers(conversation);
  const { message } = await saveEvent(conversation, user_id, "disappearing", { seconds: seconds ?? 0 });
  return { conversation, event: message };
};

export const expiryFor = (conversation) =>
  conversation.disappearAfter ? new Date(Date.now() + conversation.disappearAfter * 1000) : undefined;

// a chat whose newest message expired falls back to the one before, so it keeps its place in everyone's list
const pointAtNewestRemaining = async (conversationIds, expiredIds) => {
  const stale = await ConversationModel.find({ _id: { $in: conversationIds }, latestMessage: { $in: expiredIds } }).select("_id");
  await Promise.all(
    stale.map(async ({ _id }) => {
      const newest = await MessageModel.findOne({ conversation: _id }).sort({ _id: -1 }).select("_id");
      await ConversationModel.updateOne({ _id }, { latestMessage: newest?._id ?? null });
    })
  );
};

// messages past their time go with their files and pins, and every member's open chat drops them
export const sweepExpiredMessages = async (io) => {
  const expired = await MessageModel.find({ expiresAt: { $lte: new Date() } })
    .select("conversation attachment files batchId")
    .limit(SWEEP_BATCH)
    .lean();
  if (!expired.length) return 0;

  const ids = expired.map((message) => message._id);
  const conversationIds = [...new Set(expired.map((message) => String(message.conversation)))];
  await Promise.all([
    MessageModel.deleteMany({ _id: { $in: ids } }),
    ConversationModel.updateMany({ _id: { $in: conversationIds } }, { $pull: { pins: { message: { $in: ids } } } }),
  ]);
  await pointAtNewestRemaining(conversationIds, ids);
  await dropEmptyAlbums(expired);
  await deleteFilesNoLongerUsed(expired.flatMap((message) => [message.attachment?.url, ...(message.files ?? []).map((file) => file.url)]).filter(Boolean));

  const conversations = await ConversationModel.find({ _id: { $in: conversationIds } }).select("users");
  const roomsOf = new Map(conversations.map((conversation) => [String(conversation._id), memberRooms(conversation)]));
  expired.forEach(({ _id, conversation }) => io.to(roomsOf.get(String(conversation)) ?? []).emit("message_removed", { _id, conversation }));
  return expired.length;
};
