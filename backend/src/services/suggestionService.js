import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, FriendRequestModel, RequestCooldownModel, UserModel } from "#src/models/index.js";

const SUGGESTION_LIMIT = 20;
// ranked before the slower lookups, with room for the ones those lookups drop
const CANDIDATE_LIMIT = 100;
const NAMED_LINKS = 2;
const SUGGESTION_FIELDS = "firstName lastName username avatar cover coverStyle activityStatus suggestToFriendsOfFriends";

// for each person, the user's friends who are friends with them and the groups they are both in
const linksOf = async (user) => {
  const others = user.friends.filter((friend_id) => !friend_id.equals(user._id));
  const [friends, groups] = await Promise.all([
    UserModel.find({ _id: { $in: others } }).select("firstName friends").lean(),
    ConversationModel.find({ isGroup: true, users: user._id }).select("name users").lean(),
  ]);

  const links = new Map();
  const linkTo = (person_id) => {
    const key = String(person_id);
    if (!links.has(key)) links.set(key, { friends: [], groups: [] });
    return links.get(key);
  };
  friends.forEach((friend) => friend.friends.forEach((person_id) => linkTo(person_id).friends.push(friend.firstName)));
  groups.forEach((group) => group.users.forEach((person_id) => linkTo(person_id).groups.push(group.name)));
  return links;
};

const byMostLinks = (one, other) => other.friends.length - one.friends.length || other.groups.length - one.groups.length;

const withoutOpenRequests = async (user, ids) => {
  const eitherWay = { $or: [{ sender: user._id, recipient: { $in: ids } }, { sender: { $in: ids }, recipient: user._id }] };
  const [requests, cooldowns] = await Promise.all([
    FriendRequestModel.find(eitherWay).select("sender recipient").lean(),
    RequestCooldownModel.find({ ...eitherWay, until: { $gt: new Date() } }).select("sender recipient").lean(),
  ]);
  const taken = new Set([...requests, ...cooldowns].flatMap(({ sender, recipient }) => [String(sender), String(recipient)]));
  return ids.filter((person_id) => !taken.has(person_id));
};

const summaryOf = (labels) => ({ count: labels.length, names: labels.slice(0, NAMED_LINKS) });

const byStrongestLink = (one, other) =>
  other.mutualFriends.count - one.mutualFriends.count ||
  other.sharedGroups.count - one.sharedGroups.count ||
  one.firstName.localeCompare(other.firstName);

export const suggestionsFor = async (user) => {
  const links = await linksOf(user);
  const ruledOut = new Set([...user.friends, ...user.blocked, ...user.dismissedSuggestions].map(String));
  const ranked = [...links.keys()]
    .filter((person_id) => !ruledOut.has(person_id))
    .sort((one, other) => byMostLinks(links.get(one), links.get(other)))
    .slice(0, CANDIDATE_LIMIT);

  const people = await UserModel.find({ _id: { $in: await withoutOpenRequests(user, ranked) }, verified: true, blocked: { $ne: user._id } })
    .select(SUGGESTION_FIELDS)
    .lean();

  return people
    .map(({ suggestToFriendsOfFriends, ...person }) => {
      const { friends, groups } = links.get(String(person._id));
      // turning suggestions off hides the friends two people share, while a group they are both in shows them to each other anyway
      return { ...person, mutualFriends: summaryOf(suggestToFriendsOfFriends === false ? [] : friends), sharedGroups: summaryOf(groups) };
    })
    .filter(({ mutualFriends, sharedGroups }) => mutualFriends.count || sharedGroups.count)
    .sort(byStrongestLink)
    .slice(0, SUGGESTION_LIMIT);
};

export const dismissSuggestion = async (user, person_id) => {
  if (!mongoose.isValidObjectId(person_id) || user._id.equals(person_id)) throw createHttpError.BadRequest("Choose someone else");
  await UserModel.updateOne({ _id: user._id }, { $addToSet: { dismissedSuggestions: person_id } });
};

// a declined request or an ended friendship is never answered with a suggestion of the same person
export const forgetSuggestionsBetween = (one_id, other_id) =>
  Promise.all([
    UserModel.updateOne({ _id: one_id }, { $addToSet: { dismissedSuggestions: other_id } }),
    UserModel.updateOne({ _id: other_id }, { $addToSet: { dismissedSuggestions: one_id } }),
  ]);

export const setSuggestToFriendsOfFriends = async (user, isOn) => {
  if (typeof isOn !== "boolean") throw createHttpError.BadRequest("Choose on or off");
  await UserModel.updateOne({ _id: user._id }, { suggestToFriendsOfFriends: isOn });
  return isOn;
};
