import {
  getUserConversationIds,
  getUserConversations,
  memberRooms,
  openDirectConversation,
} from "../services/conversationService.js";

// -------------------------- Create/Open Direct Conversation --------------------------
export const createOpenConversation = async (req, res, next) => {
  try {
    const { conversation, isValidFriendShip, isNew } = await openDirectConversation(req.user, req.body.receiver_id);

    if (isNew) {
      req.app.get("io").in(memberRooms(conversation)).socketsJoin(conversation._id.toString());
    }

    res.status(200).json({ status: "success", conversation, isValidFriendShip });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get Direct Conversations --------------------------
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await getUserConversations(req.user._id);

    res.status(200).json({ status: "success", conversations: conversations });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------------------------

// ----------------------- Socket: Join Convo -----------------------
export const joinConvo = async (socket, user_id) => {
  try {
    const conversation_ids = await getUserConversationIds(user_id);
    socket.join(conversation_ids);

    return conversation_ids;
  } catch (error) {
    socket.errorHandler("Join convo error");
  }
};
