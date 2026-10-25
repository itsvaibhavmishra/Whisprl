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
  isFranking,
  saveMessage,
  validateCipher,
} from "#src/services/messageService.js";
import { findMemberConversation, memberRooms } from "#src/services/conversationService.js";
import { expiryFor } from "#src/services/disappearingService.js";
import { isGameId } from "#src/services/games/catalog.js";
import { pushNewMessage } from "#src/services/pushService.js";

export const attachFile = async (req, res) => {
  const { conversation, message } = await attachSealedFile(req.params.message_id, req.user._id, req.file);

  req.app.get("io").to(memberRooms(conversation)).emit("message_updated", message);

  res.status(200).json({ status: "success", message });
};

export const getMessages = async (req, res) => {
  const conversation = await findMemberConversation(req.params.convo_id, req.user._id);

  const { before, after, around } = req.query;
  const page = await getConvoMessages(conversation, req.user._id, { before, after, around });

  res.status(200).json({ status: "success", ...page });
};

export const getDeliverableMessages = async (req, res) => {
  const messages = await findDeliverableMessages(req.user._id);
  res.status(200).json({ status: "success", messages });
};

export const resealWaitingMessage = async (req, res) => {
  const { conversation, message } = await resealMessage(req.params.message_id, req.user._id, req.body.cipher);

  req.app.get("io").to(memberRooms(conversation)).emit("message_updated", message);

  res.status(200).json({ status: "success", message });
};

export const socketSendMessage = async (socket, payload, acknowledge) => {
  const { convo_id, clientId, cipher, franking, attachment, batch, replyTo, replyToAlbum, forwardOf, viewOnce, game } = payload;
  try {
    const user_id = socket.user._id;
    const conversation = await findSendableConversation(convo_id, user_id);
    validateCipher(cipher, conversation, user_id);

    const { message, isNew } = await saveMessage(conversation, {
      sender: user_id,
      ...(isClientId(clientId) && { clientId }),
      cipher,
      ...(isFranking(franking) && { franking }),
      ...(isGameId(game) && { game }),
      awaitingKey: !conversation.isGroup && !peerHasKey(conversation, user_id),
      ...(attachment === true && { attachment: { status: "uploading" }, ...(viewOnce === true && { viewOnce: true }) }),
      ...batchOf(batch),
      expiresAt: expiryFor(conversation),
      ...(await linksOf(conversation, user_id, { replyTo, replyToAlbum, forwardOf })),
    });

    if (isNew) {
      socket.to(memberRooms(conversation)).emit("message_received", message);
      // a push that fails must never fail the message it was about
      pushNewMessage(conversation, socket.user, message).catch(() => {});
    }
    acknowledge?.({ status: "success", message });
  } catch (error) {
    // a refusal is final, but a fault on the server's side is worth sending again
    if (acknowledge) acknowledge({ status: "error", message: error.expose ? error.message : "Could not reach Whisprl", retryable: !error.expose });
    else socket.errorHandler(error.message);
  }
};

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
