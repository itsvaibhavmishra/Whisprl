import createHttpError from "http-errors";
import {
  findDeliverableMessages,
  findSendableConversation,
  findSentMessage,
  getConvoMessages,
  getFileType,
  isClientId,
  markDelivered,
  markSeen,
  peerHasKey,
  resealMessage,
  saveMessage,
  toClientMessage,
  validateCipher,
  validateMessageFiles,
} from "../services/messageService.js";
import { findMemberConversation, memberRooms } from "../services/conversationService.js";
import { uploadFile } from "../services/fileUploadService.js";

// -------------------------- Send Message --------------------------
export const sendMessage = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const { message, convo_id, clientId, batchId, batchIndex, batchTotal } = req.body;
    const uploadedFile = req.file; // single file from multer

    if (!convo_id || !uploadedFile) {
      throw createHttpError.BadRequest("Attach a file to send");
    }

    const conversation = await findSendableConversation(convo_id, user_id);

    // a retried upload that already went through is answered without uploading the file a second time
    const alreadySent = await findSentMessage(user_id, clientId);
    if (alreadySent) {
      return res.status(200).json({ status: "success", message: toClientMessage(alreadySent, conversation) });
    }

    validateMessageFiles(uploadedFile);
    const fileUrl = await uploadFile(`Chat Files/${conversation._id}`, uploadedFile);

    const { message: sentMessage, isNew } = await saveMessage(conversation, {
      sender: user_id,
      ...(isClientId(clientId) && { clientId }),
      message: message || "",
      files: [
        {
          url: fileUrl,
          fileName: uploadedFile.originalname,
          fileType: getFileType(uploadedFile.mimetype),
          mimeType: uploadedFile.mimetype,
          size: uploadedFile.size,
        },
      ],
      ...(batchId && { batchId, batchIndex: Number(batchIndex), batchTotal: Number(batchTotal) }),
    });

    // the sender's other tabs get it too, and the tab that uploaded it matches it to its bubble by clientId
    if (isNew) req.app.get("io").to(memberRooms(conversation)).emit("message_received", sentMessage);

    res.status(200).json({ status: "success", message: sentMessage });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get All Messages --------------------------
export const getMessages = async (req, res, next) => {
  try {
    const conversation = await findMemberConversation(req.params.convo_id, req.user._id);

    const { messages, hasMore } = await getConvoMessages(conversation._id, req.query.before);

    res.status(200).json({ status: "success", messages, hasMore });
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
export const socketSendMessage = async (socket, { convo_id, clientId, cipher }, acknowledge) => {
  try {
    const user_id = socket.user._id;
    const conversation = await findSendableConversation(convo_id, user_id);
    validateCipher(cipher, conversation, user_id);

    const { message, isNew } = await saveMessage(conversation, {
      sender: user_id,
      ...(isClientId(clientId) && { clientId }),
      cipher,
      awaitingKey: !peerHasKey(conversation, user_id),
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
const emitReceipt = (socket, conversation_id, receipt) =>
  socket.to(conversation_id).emit("receipts", {
    conversation_id,
    reader: socket.user._id,
    receipt,
    at: new Date(),
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
    if (await markSeen(conversation_id, socket.user._id)) {
      emitReceipt(socket, conversation_id, "seen");
    }
  } catch (error) {
    socket.errorHandler(error.message);
  }
};
