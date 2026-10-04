import createHttpError from "http-errors";
import {
  createMessage,
  getConvoMessages,
  getFileType,
  populateMessage,
  updateLatestMessage,
  validateFriendship,
  validateMessageFiles,
} from "../services/messageService.js";
import { uploadFiles } from "../services/fileUploadService.js";
import { ConversationModel } from "../models/index.js";

// -------------------------- Send Message --------------------------
export const sendMessage = async (req, res, next) => {
  try {
    const user_id = req.user._id;
    const { message, convo_id, batchId, batchIndex, batchTotal } = req.body;
    const uploadedFile = req.file; // single file from multer

    if (!convo_id || (!message && !uploadedFile)) {
      throw createHttpError.BadRequest("Invalid conversation id or message");
    }

    const convo_exists = await ConversationModel.findById({ _id: convo_id });

    if (!convo_exists) {
      throw createHttpError.NotFound("Conversation does not exist");
    }

    // Check if there's only one user in the conversation and it's the current user
    if (
      !(
        convo_exists.users.length === 1 &&
        convo_exists.users[0].toString() === user_id.toString()
      )
    ) {
      // Check if users are friends
      await validateFriendship(user_id, convo_exists);
    }

    // Handle single file upload to Cloudinary
    let filesData = [];
    if (uploadedFile) {
      validateMessageFiles(uploadedFile);

      const uploadResult = await uploadFiles(
        "Chat Files",
        uploadedFile,
        convo_id.toString()
      );

      filesData = [{
        url: uploadResult.fileUrls[0],
        fileName: uploadedFile.originalname,
        fileType: getFileType(uploadedFile.mimetype),
        mimeType: uploadedFile.mimetype,
        size: uploadedFile.size,
      }];
    }

    const msgData = {
      sender: user_id,
      message: message || "",
      conversation: convo_id,
      files: filesData,
      ...(batchId && { batchId, batchIndex: Number(batchIndex), batchTotal: Number(batchTotal) }),
    };

    const newMessage = await createMessage(msgData);

    await updateLatestMessage(convo_id, newMessage);

    const populatedMessage = await populateMessage(newMessage._id);

    res.status(200).json({ status: "success", message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get All Messages --------------------------
export const getMessages = async (req, res, next) => {
  try {
    const convo_id = req.params.convo_id;

    if (!convo_id) {
      throw createHttpError.BadRequest("Conversation id is required");
    }

    const messages = await getConvoMessages(convo_id);

    res.status(200).json({ status: "success", messages: messages });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------------------

// -------------------------- Socket Send Message --------------------------
export const socketSendMessage = async (socket, user_id, messageData) => {
  try {
    const { _id, message, conversation, files } = messageData;

    const convo_id = conversation._id;

    if (!convo_id || (!message && (!files || files.length === 0))) {
      throw createHttpError.BadRequest("Invalid conversation id or message");
    }

    const convo_exists = await ConversationModel.findById({ _id: convo_id });

    if (!convo_exists) {
      throw createHttpError.NotFound("Conversation does not exist");
    }

    // Check if there's only one user in the conversation and it's the current user
    if (
      !(
        convo_exists.users.length === 1 &&
        convo_exists.users[0].toString() === user_id.toString()
      )
    ) {
      // Check if users are friends
      await validateFriendship(user_id, convo_exists);
    }

    const msgData = {
      _id: _id,
      sender: user_id,
      message,
      conversation: convo_id,
      files: files || [],
    };

    const newMessage = await createMessage(msgData);

    await updateLatestMessage(convo_id, newMessage);

    const populatedMessage = await populateMessage(newMessage._id);

    return { message: populatedMessage };
  } catch (error) {
    console.log(error);
    socket.errorHandler(error.message);
  }
};
