export const MAX_GROUP_SIZE = 32;
export const MAX_GROUP_NAME = 40;

export const memberOf = (group, userId) =>
  [...group.users, ...(group.formerUsers ?? [])].find((member) => member._id === userId);

export const isOwnerOf = (group, userId) => group.owner === userId;

export const isAdminOf = (group, userId) => Boolean(group.admins?.includes(userId));

export const canManage = (group, userId) => isOwnerOf(group, userId) || isAdminOf(group, userId);

export const membersLabel = (group) => `${group.users.length} member${group.users.length === 1 ? "" : "s"}`;

export const roleOf = (group, userId) => {
  if (isOwnerOf(group, userId)) return "Owner";
  return isAdminOf(group, userId) ? "Admin" : null;
};

export const mayRemove = (group, meId, memberId) =>
  memberId !== meId && (isOwnerOf(group, meId) || (isAdminOf(group, meId) && !canManage(group, memberId)));

const nameIn = (group, userId, meId) => (userId === meId ? "you" : memberOf(group, userId)?.firstName ?? "someone");

export const listOf = (names) => (names.length < 3 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

export const typingNamesIn = (conversation, typingConversation, meId) =>
  typingConversation
    .filter((typist) => typist.typing && typist.conversation_id === conversation._id && typist.user_id !== meId)
    .map((typist) => memberOf(conversation, typist.user_id)?.firstName)
    .filter(Boolean);

export const typingLabel = (names, isGroup) =>
  isGroup ? `${listOf(names)} ${names.length === 1 ? "is" : "are"} typing…` : "typing…";

const capitalised = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export const firstNameIn = (conversation, userId, meId) => capitalised(nameIn(conversation, userId, meId));

export const DAY_SECONDS = 24 * 60 * 60;

export const durationOf = (seconds) => (seconds < 2 * DAY_SECONDS ? `${seconds / 3600} hours` : `${seconds / DAY_SECONDS} days`);

const SENTENCES = {
  created: ({ actor, event }) => `${actor} created "${event.name}"`,
  added: ({ actor, targets }) => `${actor} added ${targets}`,
  removed: ({ actor, targets }) => `${actor} removed ${targets}`,
  left: ({ actor }) => `${actor} left`,
  renamed: ({ actor, event }) => `${actor} renamed the group to "${event.name}"`,
  photo: ({ actor }) => `${actor} changed the group photo`,
  admin_added: ({ actor, targets }) => `${actor} made ${targets} an admin`,
  admin_removed: ({ actor, targets }) => `${actor} removed ${targets} as an admin`,
  owner: ({ targets }) => `${targets} ${targets === "you" ? "now own" : "now owns"} the group`,
  pinned: ({ actor }) => `${actor} pinned a message`,
  disappearing: ({ actor, event }) =>
    event.seconds
      ? `${actor} turned on disappearing messages. New messages disappear after ${durationOf(event.seconds)}`
      : `${actor} turned off disappearing messages`,
};

export const describeEvent = (message, group, meId) => {
  const { event } = message;
  const actor = nameIn(group, message.sender._id, meId);
  const targets = listOf((event.users ?? []).map((userId) => nameIn(group, userId, meId)));
  return capitalised(SENTENCES[event.type]({ actor, targets, event }));
};
