import {
  findCommonGroups,
  getUserConversationIds,
  getUserConversations,
  memberRooms,
  openDirectConversation,
  pinMessage,
  pinsOf,
  populateMembers,
  unpinMessage,
} from "#src/services/conversationService.js";
import { saveEvent } from "#src/services/messageService.js";

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
    const conversations = await getUserConversations(req.user);

    res.status(200).json({ status: "success", conversations: conversations });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Pins --------------------------
export const announcePins = async (io, conversation) =>
  io.to(memberRooms(conversation)).emit("pins_updated", { conversation_id: conversation._id, pins: await pinsOf(conversation) });

export const pin = async (req, res, next) => {
  try {
    const { conversation, isNew } = await pinMessage(req.params.convo_id, req.user._id, req.params.message_id);
    const io = req.app.get("io");

    await announcePins(io, conversation);
    if (isNew) {
      const { message } = await saveEvent(await populateMembers(conversation), req.user._id, "pinned");
      io.to(memberRooms(conversation)).emit("message_received", message);
    }
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

export const unpin = async (req, res, next) => {
  try {
    const conversation = await unpinMessage(req.params.convo_id, req.user._id, req.params.message_id);
    await announcePins(req.app.get("io"), conversation);
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Groups In Common --------------------------
export const getCommonGroups = async (req, res, next) => {
  try {
    const groups = await findCommonGroups(req.user._id, req.params.user_id);
    res.status(200).json({ status: "success", groups });
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
