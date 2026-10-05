import createHttpError from "http-errors";

import { UserModel } from "../models/index.js";
import {
  createConversation,
  findConversation,
  getUserConversations,
  memberRooms,
} from "../services/conversationService.js";

// -------------------------- Create/Open Direct Conversation --------------------------
export const createOpenConversation = async (req, res, next) => {
  try {
    const sender = req.user;

    const sender_id = sender._id;
    const { receiver_id } = req.body;

    // check for required fields
    if (!receiver_id) {
      throw createHttpError.BadRequest("Something went wrong");
    }

    // check if receiver exists
    const receiver = await UserModel.findOne({
      _id: receiver_id,
      verified: true,
    });

    // check if receiver exists
    if (!receiver) {
      throw createHttpError.NotFound("Verified Receiver does not exist");
    }

    // check for existing conversation
    const existing_conversation = await findConversation(
      sender_id,
      receiver_id
    );

    const isValidFriendShip = !(
      !sender.friends.includes(receiver_id) ||
      !receiver.friends.includes(sender_id)
    );

    if (existing_conversation) {
      res.status(200).json({
        status: "success",
        conversation: existing_conversation,
        isValidFriendShip,
      });
    } else {
      // check if users are friends
      if (
        !sender.friends.includes(receiver_id) ||
        !receiver.friends.includes(sender_id)
      ) {
        throw createHttpError.Forbidden("You are not friends with this user");
      }

      // creating a new conversation
      let convoData;

      if (sender_id.toString() === receiver_id.toString()) {
        convoData = {
          name: `${receiver.firstName} ${receiver.lastName}`,
          isGroup: false,
          users: [receiver_id],
        };
      } else {
        convoData = {
          name: `${receiver.firstName} ${receiver.lastName}`,
          isGroup: false,
          users: [sender_id, receiver_id],
        };
      }

      const new_conversation = await createConversation(convoData);

      req.app.get("io").in(memberRooms(new_conversation)).socketsJoin(new_conversation._id.toString());

      res.status(200).json({
        status: "success",
        conversation: new_conversation,
        isValidFriendShip,
      });
    }
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get Direct Conversations --------------------------
export const getConversations = async (req, res, next) => {
  try {
    const user_id = req.user._id;

    const conversations = await getUserConversations(user_id);

    res.status(200).json({ status: "success", conversations: conversations });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------------------

// ----------------------- Socket: Join Convo -----------------------
export const joinConvo = async (socket, user_id) => {
  try {
    const conversations = await getUserConversations(user_id);

    const conversation_ids = conversations.map((convo) => convo._id.toString());
    socket.join(conversation_ids);

    return conversation_ids;
  } catch (error) {
    socket.errorHandler("Join convo error");
  }
};
