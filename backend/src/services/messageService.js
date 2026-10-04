import createHttpError from "http-errors";
import { ConversationModel, MessageModel, UserModel } from "../models/index.js";

// validate friendship before sending message
export const validateFriendship = async (sender_id, conversation) => {
  // extract receiver id from convo
  const users = conversation.users;
  const receiver_id = users.find(
    (user) => user.toString() !== sender_id.toString()
  );

  // getting sender and receiver
  const senderUser = await UserModel.findById(sender_id);
  const receiverUser = await UserModel.findById(receiver_id);

  // Check if users are friends
  if (
    !senderUser.friends.includes(receiver_id) ||
    !receiverUser.friends.includes(sender_id)
  ) {
    throw createHttpError.Forbidden("You are no longer friends with this user");
  }
};

// validate files before uploading
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const allowedDocTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-rar-compressed",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// validates a single file object
export const validateMessageFiles = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    throw createHttpError.BadRequest(
      `File "${file.originalname}" exceeds the 5MB size limit`
    );
  }

  const isImage = allowedImageTypes.includes(file.mimetype);
  const isDoc = allowedDocTypes.includes(file.mimetype);

  if (!isImage && !isDoc) {
    throw createHttpError.BadRequest(
      `File type "${file.mimetype}" is not allowed`
    );
  }
};

export const getFileType = (mimetype) => {
  return allowedImageTypes.includes(mimetype) ? "image" : "document";
};

// send a new message with conversation id
export const createMessage = async (data) => {
  const newMessage = await MessageModel.create(data);

  if (!newMessage) {
    throw createHttpError.BadRequest("Unable to create new message");
  }

  return newMessage;
};

// populate message with data
export const populateMessage = async (id) => {
  const msg = await MessageModel.findById(id)
    .populate({
      path: "sender",
      select: "firstName lastName avatar",
      model: "User",
    })
    .populate({
      path: "conversation",
      select: "name picture isGroup users latestMessage",
      model: "Conversation",
      populate: [
        {
          path: "users",
          select: "firstName lastName avatar email activityStatus onlineStatus",
          model: "User",
        },
        {
          path: "latestMessage",
          model: "Message",
          populate: {
            path: "sender",
            select:
              "firstName lastName avatar email activityStatus onlineStatus",
            model: "User",
          },
        },
      ],
    });

  if (!msg) {
    throw createHttpError.BadRequest("Unable to populate message");
  }

  return msg;
};

// update latest message on conversation model
export const updateLatestMessage = async (convo_id, msg) => {
  const updatedConvo = await ConversationModel.findByIdAndUpdate(convo_id, {
    latestMessage: msg,
  });

  if (!updatedConvo) {
    throw createHttpError.BadRequest("Unable to update latest message");
  }

  return updatedConvo;
};

// fetch all messages with conversation id
export const getConvoMessages = async (convo_id) => {
  const messages = await MessageModel.find({ conversation: convo_id })
    .populate("sender", "firstName lastName avatar email activityStatus")
    .populate("conversation");

  if (!messages) {
    throw createHttpError.BadRequest("Unable to fetch messages");
  }

  return messages;
};
