import createHttpError from "http-errors";

import { ChatPreferenceModel } from "#src/models/index.js";

const HOUR_MS = 60 * 60 * 1000;
const MUTED_FOREVER = new Date("9999-12-31T00:00:00Z");
const MUTE_LENGTHS = { "8h": 8 * HOUR_MS, "1w": 7 * 24 * HOUR_MS };

const mutedUntilFor = (mute) => {
  if (mute === "off") return null;
  if (mute === "always") return MUTED_FOREVER;
  if (MUTE_LENGTHS[mute]) return new Date(Date.now() + MUTE_LENGTHS[mute]);
  throw createHttpError.BadRequest("Mute for 8 hours, a week or always");
};

const asFlag = (value, label) => {
  if (typeof value !== "boolean") throw createHttpError.BadRequest(`Say whether the chat is ${label}`);
  return value;
};

const PREFERENCE_FIELDS = "mutedUntil isFavourite isArchived clearedAt deletedAt";

// the record's own id stays behind, since the answer is merged into the conversation it describes
const save = async (user_id, conversation_id, changes) => {
  const { _id, ...preferences } = await ChatPreferenceModel.findOneAndUpdate({ user: user_id, conversation: conversation_id }, changes, {
    upsert: true,
    new: true,
    projection: PREFERENCE_FIELDS,
  }).lean();
  return preferences;
};

export const updatePreferences = (user_id, conversation_id, { mute, isFavourite, isArchived }) => {
  const changes = {
    ...(mute !== undefined && { mutedUntil: mutedUntilFor(mute) }),
    ...(isFavourite !== undefined && { isFavourite: asFlag(isFavourite, "a favourite") }),
    ...(isArchived !== undefined && { isArchived: asFlag(isArchived, "archived") }),
  };
  if (!Object.keys(changes).length) throw createHttpError.BadRequest("Nothing to change");
  return save(user_id, conversation_id, changes);
};

export const clearChat = (user_id, conversation_id) => save(user_id, conversation_id, { clearedAt: new Date() });

// leaving a group already takes it out of the list, so only a direct chat is deleted this way
export const deleteChat = (user_id, conversation) => {
  if (conversation.isGroup) throw createHttpError.BadRequest("Leave the group to remove it from your chats");
  const now = new Date();
  return save(user_id, conversation._id, { clearedAt: now, deletedAt: now });
};

export const preferencesOf = async (user_id, conversation_ids) => {
  const preferences = await ChatPreferenceModel.find({ user: user_id, conversation: { $in: conversation_ids } })
    .select(`conversation ${PREFERENCE_FIELDS}`)
    .lean();
  return new Map(preferences.map(({ conversation, _id, ...preference }) => [String(conversation), preference]));
};

export const clearedAtFor = async (user_id, conversation_id) =>
  (await ChatPreferenceModel.findOne({ user: user_id, conversation: conversation_id }).select("clearedAt").lean())?.clearedAt;
