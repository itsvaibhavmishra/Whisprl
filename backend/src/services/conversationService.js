import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, UserModel } from "../models/index.js";
import { PUBLIC_PROFILE_FIELDS } from "./userService.js";

export const MEMBER_FIELDS = `${PUBLIC_PROFILE_FIELDS} onlineStatus`;

// encryption pairs exactly two people, so group conversations stay out of every chat path
const DIRECT = { isGroup: false };

export const memberRooms = (conversation, exceptUserId) =>
  conversation.users.map((member) => String(member._id)).filter((userId) => userId !== String(exceptUserId));

// one answer for "missing" and "not yours", so ids cannot be probed
export const findMemberConversation = async (convo_id, user_id) => {
  const conversation = mongoose.isValidObjectId(convo_id)
    ? await ConversationModel.findOne({ _id: convo_id, users: user_id, ...DIRECT })
    : null;

  if (!conversation) {
    throw createHttpError.NotFound("Conversation does not exist");
  }

  return conversation;
};

// find an existing direct conversation
export const findConversation = async (sender_id, receiver_id) => {
  let convos;
  if (sender_id.toString() === receiver_id.toString()) {
    convos = await ConversationModel.find({
      isGroup: false,
      users: { $all: [receiver_id], $size: 1 },
    })
      .populate("users", MEMBER_FIELDS)
      .populate("latestMessage");
  } else {
    convos = await ConversationModel.find({
      isGroup: false,
      $and: [
        { users: { $elemMatch: { $eq: sender_id } } },
        { users: { $elemMatch: { $eq: receiver_id } } },
      ],
    })
      .populate("users", MEMBER_FIELDS)
      .populate("latestMessage");
  }

  // conversation doesnt exists
  if (!convos) {
    throw createHttpError.BadRequest(
      "Something went wrong in getting conversation"
    );
  }

  // populating messages model
  convos = await UserModel.populate(convos, {
    path: "latestMessage.sender",
    select: MEMBER_FIELDS,
  });

  return convos[0];
};

// create a new direct conversation
export const createConversation = async (convoData) => {
  const newConvo = await ConversationModel.create(convoData);

  if (!newConvo) {
    throw createHttpError.InternalServerError("Unable to create conversation");
  }

  const populatedConvo = await ConversationModel.findOne({
    _id: newConvo._id,
  }).populate("users", MEMBER_FIELDS);

  if (!populatedConvo) {
    throw createHttpError.BadRequest("Unable to populate conversation");
  }

  return populatedConvo;
};

// get all conversations for user
export const getUserConversations = async (user_id) => {
  let conversations;
  await ConversationModel.find({
    users: { $elemMatch: { $eq: user_id } },
    ...DIRECT,
  })
    .populate("users", MEMBER_FIELDS)
    .populate("admin", MEMBER_FIELDS)
    .populate("latestMessage")
    .sort({ updatedAt: -1 })
    .then(async (results) => {
      results = await UserModel.populate(results, {
        path: "latestMessage.sender",
        select: MEMBER_FIELDS,
      });
      conversations = results;
    })
    .catch((err) => {
      throw createHttpError.BadRequest(
        "Error fetching conversations, try again"
      );
    });

  return conversations;
};
