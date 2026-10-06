import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "#src/models/index.js";
import { populateMembers } from "#src/services/conversationService.js";
import { deleteFile, isCloudinaryFile, uploadFile } from "#src/services/fileUploadService.js";
import { blockedEitherWay } from "#src/services/blockService.js";
import { saveEvent } from "#src/services/messageService.js";
import { validateProfileImage } from "#src/services/userService.js";

const MAX_GROUP_SIZE = 32;
const MAX_NAME_LENGTH = 40;
const GROUP = { isGroup: true, owner: { $exists: true } };

const isIn = (ids, user_id) => ids.some((id) => id.equals(user_id));
const isOwner = (group, user_id) => group.owner.equals(user_id);
const isManager = (group, user_id) => isOwner(group, user_id) || isIn(group.admins, user_id);

const nameOf = (name) => {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
    throw createHttpError.BadRequest(`Give the group a name of up to ${MAX_NAME_LENGTH} characters`);
  }
  return trimmed;
};

const assertRoomFor = (count) => {
  if (count > MAX_GROUP_SIZE) throw createHttpError.BadRequest(`A group can have up to ${MAX_GROUP_SIZE} people`);
};

export const assertManager = (group, user_id) => {
  if (!isManager(group, user_id)) throw createHttpError.Forbidden("Only the group's owner and admins can do that");
};

const findGroup = async (group_id, user_id) => {
  const group = mongoose.isValidObjectId(group_id)
    ? await ConversationModel.findOne({ _id: group_id, users: user_id, ...GROUP })
    : null;
  if (!group) throw createHttpError.NotFound("Group does not exist");
  return group;
};

// every message is sealed for each member's key, so only friends who already have one can join
const addableFriends = async (user, user_ids) => {
  const ids = [...new Set((Array.isArray(user_ids) ? user_ids : []).map(String))].filter(
    (id) => mongoose.isValidObjectId(id) && id !== String(user._id)
  );
  if (!ids.every((id) => isIn(user.friends, id))) throw createHttpError.BadRequest("You can only add your friends");
  const blocked = await blockedEitherWay(user, ids);
  if (ids.some((id) => blocked.has(id))) throw createHttpError.BadRequest("You can't add some of these friends");

  const ready = await UserModel.find({ _id: { $in: ids }, verified: true, "publicKeys.0": { $exists: true } }).select("_id");
  if (ready.length !== ids.length) {
    throw createHttpError.BadRequest("Only friends who have opened Whisprl since encryption arrived can be added");
  }
  return ready.map(({ _id }) => _id);
};

const withEvents = async (group, actor_id, events, departed = []) => {
  await populateMembers(group);
  const saved = [];
  for (const [type, details] of events) saved.push((await saveEvent(group, actor_id, type, details)).message);
  return { group, groupId: group._id, events: saved, departed };
};

export const createGroup = async (user, { name, member_ids }) => {
  const groupName = nameOf(name);
  const members = await addableFriends(user, member_ids);
  if (members.length < 2) throw createHttpError.BadRequest("Choose at least two friends for a group");
  assertRoomFor(members.length + 1);

  const users = [user._id, ...members];
  const now = new Date();
  const group = await ConversationModel.create({
    name: groupName,
    isGroup: true,
    owner: user._id,
    users,
    joinedAt: Object.fromEntries(users.map((id) => [String(id), now])),
  });

  return withEvents(group, user._id, [["created", { name: groupName }]]);
};

export const updateGroupDetails = async (user, group_id, { name, removePicture }, picture) => {
  const group = await findGroup(group_id, user._id);
  assertManager(group, user._id);

  const events = [];
  const newName = name === undefined ? group.name : nameOf(name);
  if (newName !== group.name) {
    group.name = newName;
    events.push(["renamed", { name: newName }]);
  }

  const replaced = (picture || removePicture === "true") && group.picture;
  if (picture) {
    validateProfileImage("avatar", picture);
    group.picture = await uploadFile(`Group Photos/${group._id}`, picture);
    events.push(["photo"]);
  } else if (replaced) {
    group.picture = "";
    events.push(["photo"]);
  }

  await group.save();
  if (isCloudinaryFile(replaced)) await deleteFile(replaced).catch(() => {});
  return withEvents(group, user._id, events);
};

export const addMembers = async (user, group_id, member_ids) => {
  const group = await findGroup(group_id, user._id);
  assertManager(group, user._id);

  const added = (await addableFriends(user, member_ids)).filter((id) => !isIn(group.users, id));
  if (!added.length) throw createHttpError.BadRequest("Choose friends who are not in the group yet");
  assertRoomFor(group.users.length + added.length);

  const now = new Date();
  group.users.push(...added);
  group.formerUsers = group.formerUsers.filter((id) => !isIn(added, id));
  added.forEach((id) => group.joinedAt.set(String(id), now));
  await group.save();

  return withEvents(group, user._id, [["added", { users: added }]]);
};

const dropMember = (group, member_id) => {
  group.users = group.users.filter((id) => !id.equals(member_id));
  group.admins = group.admins.filter((id) => !id.equals(member_id));
  if (!isIn(group.formerUsers, member_id)) group.formerUsers.push(member_id);
};

const successorOf = (group) => {
  const longestStanding = (ids) => [...ids].sort((first, second) => group.joinedAt.get(String(first)) - group.joinedAt.get(String(second)))[0];
  return longestStanding(group.admins) ?? longestStanding(group.users);
};

const deleteGroup = async (group) => {
  const withFiles = await MessageModel.find({ conversation: group._id, "attachment.url": { $exists: true } }).select("attachment");
  const files = withFiles.map(({ attachment }) => attachment.url);
  if (isCloudinaryFile(group.picture)) files.push(group.picture);
  await Promise.allSettled(files.map((file) => deleteFile(file)));
  await MessageModel.deleteMany({ conversation: group._id });
  await group.deleteOne();
};

const leave = async (group, user_id) => {
  dropMember(group, user_id);
  if (!group.users.length) {
    await deleteGroup(group);
    return { group: null, groupId: group._id, events: [], departed: [user_id] };
  }

  const events = [["left"]];
  if (isOwner(group, user_id)) {
    group.owner = successorOf(group);
    group.admins = group.admins.filter((id) => !id.equals(group.owner));
    events.push(["owner", { users: [group.owner] }]);
  }
  await group.save();
  return withEvents(group, user_id, events, [user_id]);
};

export const removeMember = async (user, group_id, member_id) => {
  const group = await findGroup(group_id, user._id);
  if (String(member_id) === String(user._id)) return leave(group, user._id);
  if (!mongoose.isValidObjectId(member_id) || !isIn(group.users, member_id)) {
    throw createHttpError.NotFound("They are not in this group");
  }

  const mayRemove = isOwner(group, user._id) || (isIn(group.admins, user._id) && !isManager(group, member_id));
  if (!mayRemove) throw createHttpError.Forbidden("Admins can remove members, and only the owner can remove an admin");

  dropMember(group, member_id);
  await group.save();
  return withEvents(group, user._id, [["removed", { users: [member_id] }]], [member_id]);
};

export const setAdmin = async (user, group_id, member_id, makeAdmin) => {
  const group = await findGroup(group_id, user._id);
  if (!isOwner(group, user._id)) throw createHttpError.Forbidden("Only the group's owner can choose admins");
  if (!mongoose.isValidObjectId(member_id) || !isIn(group.users, member_id) || isOwner(group, member_id)) {
    throw createHttpError.BadRequest("Choose another member of the group");
  }
  if (isIn(group.admins, member_id) === makeAdmin) return withEvents(group, user._id, []);

  group.admins = makeAdmin ? [...group.admins, member_id] : group.admins.filter((id) => !id.equals(member_id));
  await group.save();
  return withEvents(group, user._id, [[makeAdmin ? "admin_added" : "admin_removed", { users: [member_id] }]]);
};
