import {
  attachSealedFile,
  batchOf,
  findDeliverableMessages,
  findSendableConversation,
  getConvoMessages,
  isClientId,
  linksOf,
  markDelivered,
  markSeen,
  peerHasKey,
  resealMessage,
  saveMessage,
  validateCipher,
} from "../services/messageService.js";
import { findMemberConversation, memberRooms } from "../services/conversationService.js";

// -------------------------- Attach Encrypted File --------------------------
export const attachFile = async (req, res, next) => {
  try {
    const { conversation, message } = await attachSealedFile(req.params.message_id, req.user._id, req.file);

    req.app.get("io").to(memberRooms(conversation)).emit("message_updated", message);

    res.status(200).json({ status: "success", message });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get All Messages --------------------------
export const getMessages = async (req, res, next) => {
  try {
    const conversation = await findMemberConversation(req.params.convo_id, req.user._id);

    const { before, after, around } = req.query;
    const page = await getConvoMessages(conversation, req.user._id, { before, after, around });

    res.status(200).json({ status: "success", ...page });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Waiting Messages --------------------------
export const getDeliverableMessages = async (req, res, next) => {
  try {
    const messages = await findDeliverableMessages(req.user._id);
    res.status(200).json({ status: "success", messages });
  } catch (error) {
    next(error);
  }
};

export const resealWaitingMessage = async (req, res, next) => {
  try {
    const { conversation, message } = await resealMessage(req.params.message_id, req.user._id, req.body.cipher);

    req.app.get("io").to(memberRooms(conversation)).emit("message_updated", message);

    res.status(200).json({ status: "success", message });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------------------

// -------------------------- Socket Send Message --------------------------
export const socketSendMessage = async (socket, payload, acknowledge) => {
  const { convo_id, clientId, cipher, attachment, batch, replyTo, forwardOf } = payload;
  try {
    const user_id = socket.user._id;
    const conversation = await findSendableConversation(convo_id, user_id);
    validateCipher(cipher, conversation, user_id);

    const { message, isNew } = await saveMessage(conversation, {
      sender: user_id,
      ...(isClientId(clientId) && { clientId }),
      cipher,
      awaitingKey: !conversation.isGroup && !peerHasKey(conversation, user_id),
      ...(attachment === true && { attachment: { status: "uploading" } }),
      ...batchOf(batch),
      ...(await linksOf(conversation, user_id, { replyTo, forwardOf })),
    });

    if (isNew) socket.to(memberRooms(conversation)).emit("message_received", message);
    acknowledge?.({ status: "success", message });
  } catch (error) {
    // a refusal is final, but a fault on the server's side is worth sending again
    if (acknowledge) acknowledge({ status: "error", message: error.expose ? error.message : "Could not reach Whisprl", retryable: !error.expose });
    else socket.errorHandler(error.message);
  }
};

// -------------------------- Socket Receipts --------------------------
const emitReceipt = (socket, conversation_id, receipt, details = {}) =>
  socket.to(conversation_id).emit("receipts", {
    conversation_id,
    reader: socket.user._id,
    receipt,
    at: new Date(),
    ...details,
  });

export const socketMarkDelivered = async (socket, conversation_ids) => {
  try {
    const newlyDeliveredIn = await markDelivered(conversation_ids, socket.user._id);
    newlyDeliveredIn.forEach((conversation_id) => emitReceipt(socket, conversation_id, "delivered"));
  } catch (error) {
    socket.errorHandler(error.message);
  }
};

export const socketMarkSeen = async (socket, conversation_id) => {
  try {
    const seen = await markSeen(conversation_id, socket.user._id);
    if (seen) emitReceipt(socket, conversation_id, "seen", seen);
  } catch (error) {
    socket.errorHandler(error.message);
  }
};
