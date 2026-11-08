import { UserModel } from "#src/models/index.js";

export const JOURNEY_STAGES = ["verified", "birthday", "username", "recoveryKey", "firstFriend", "firstMessage"];

const fieldOf = (stage) => `${stage}At`;

export const reachedFieldOf = (stage) => `journey.${fieldOf(stage)}`;

const isTracked = (user) => Boolean(user.journey?.startedAt);

// only accounts made since tracking began have a journey, so an older account never reads as stuck
export const startJourney = (user, via, reachedStages = []) => {
  if (isTracked(user)) return;
  const now = new Date();
  user.journey = { startedAt: now, via, ...Object.fromEntries(reachedStages.map((stage) => [fieldOf(stage), now])) };
};

// each stage keeps the first time it was reached, so unfriending or deleting messages never moves anyone back
export const markReached = (user, stage) => {
  if (isTracked(user) && !user.journey[fieldOf(stage)]) user.journey[fieldOf(stage)] = new Date();
};

const markReachedById = (userIds, stage) =>
  UserModel.updateMany(
    { _id: { $in: userIds }, "journey.startedAt": { $exists: true }, [reachedFieldOf(stage)]: { $exists: false } },
    { $set: { [reachedFieldOf(stage)]: new Date() } }
  );

export const markFriendsMade = (userIds) => markReachedById(userIds, "firstFriend");

// a note to yourself isn't using chat, so only a message someone else receives counts
export const markMessageSent = async (sender, conversation) => {
  if (!isTracked(sender) || sender.journey.firstMessageAt) return;
  if (conversation.users.every((member) => String(member._id ?? member) === String(sender._id))) return;
  sender.journey.firstMessageAt = new Date();
  await markReachedById([sender._id], "firstMessage");
};
