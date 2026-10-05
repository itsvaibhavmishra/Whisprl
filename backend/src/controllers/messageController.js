import createHttpError from "http-errors";
import {
  findDeliverableMessages,
  findSendableConversation,
  getConvoMessages,
  getFileType,
  markDelivered,
  markSeen,
  peerHasKey,
  resealMessage,
  saveMessage,
  validateCipher,
  validateMessageFiles,
} from "../services/messageService.js";
import { findMemberConversation, memberRooms } from "../services/conversationService.js";
import { uploadFiles } from "../services/fileUploadService.js";

// -------------------------- Send Message --------------------------
export const sendMessage = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const { message, convo_id, batchId, batchIndex, batchTotal } = req.body;
    const uploadedFile = req.file; // single file from multer

    if (!convo_id || !uploadedFile) {
      throw createHttpError.BadRequest("Attach a file to send");
    }

    const conversation = await findSendableConversation(convo_id, user_id);

    validateMessageFiles(uploadedFile);
    const uploadResult = await uploadFiles("Chat Files", uploadedFile, conversation._id.toString());

    const sentMessage = await saveMessage(conversation, {
      sender: user_id,
      message: message || "",
      files: [
        {
          url: uploadResult.fileUrls[0],
          fileName: uploadedFile.originalname,
          fileType: getFileType(uploadedFile.mimetype),
          mimeType: uploadedFile.mimetype,
          size: uploadedFile.size,
        },
      ],
      ...(batchId && { batchId, batchIndex: Number(batchIndex), batchTotal: Number(batchTotal) }),
    });

    req.app.get("io").to(memberRooms(conversation, user_id)).emit("message_received", sentMessage);

    res.status(200).json({ status: "success", message: sentMessage });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get All Messages --------------------------
export const getMessages = async (req, res, next) => {
  try {
    const conversation = await findMemberConversation(req.params.convo_id, req.user._id);

    const messages = await getConvoMessages(conversation._id);

    res.status(200).json({ status: "success", messages: messages });
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
export const socketSendMessage = async (io, socket, { convo_id, cipher }, acknowledge) => {
  try {
    const user_id = socket.user._id;

    const conversation = await findSendableConversation(convo_id, user_id);
    validateCipher(cipher, conversation, user_id);

    const sentMessage = await saveMessage(conversation, {
      sender: user_id,
      cipher,
      awaitingKey: !peerHasKey(conversation, user_id),
    });

    io.to(memberRooms(conversation)).emit("message_received", sentMessage);
    acknowledge?.({ status: "success" });
  } catch (error) {
    if (acknowledge) acknowledge({ status: "error", message: error.message });
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
