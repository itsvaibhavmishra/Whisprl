import { createAsyncThunk } from "@reduxjs/toolkit";

import { SetLoading, ShowSnackbar } from "../userSlice";

import axios from "../../../utils/axios";
import { socket } from "../../../utils/socket";
import { decryptMessage, encryptMessage } from "@/utils/crypto/messageCipher";
import {
  closeActiveConversation,
  replaceMessage,
  updateMsgConvo,
  updatePendingMessage,
  removePendingMessage,
} from "@/redux/slices/chatSlice";

const withReadablePreview = async (conversation) =>
  conversation.latestMessage
    ? { ...conversation, latestMessage: await decryptMessage(conversation.latestMessage, conversation) }
    : conversation;

const conversationById = ({ chat }, conversationId) =>
  [chat.activeConversation, ...chat.conversations].find((conversation) => conversation?._id === conversationId);

const SEND_TIMEOUT = 10000;

const isFromSomeoneElse = (message, getState) => message.sender?._id !== getState().user.user._id;

// Module-level map: localId → AbortController (non-serializable, not in Redux)
export const uploadAbortControllers = new Map();

// ------------- Get Conversation Thunk -------------
export const GetConversations = createAsyncThunk(
  "conversation/get-conversations",
  async (arg, { rejectWithValue, dispatch }) => {
    try {
      // set user loading to true
      dispatch(SetLoading(true));

      const { data } = await axios.get("/conversation/get-conversations/");
      const conversations = await Promise.all(data.conversations.map(withReadablePreview));

      // set user loading to false
      dispatch(SetLoading(false));
      return { ...data, conversations };
    } catch (error) {
      // set user loading to false
      dispatch(SetLoading(false));

      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Create or Open Conversation -------------
export const CreateOpenConversation = createAsyncThunk(
  "conversation/create-open-conversation",
  async (value, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post(
        "/conversation/create-open-conversation",
        {
          receiver_id: value,
        }
      );

      dispatch(closeActiveConversation());

      return { ...data, conversation: await withReadablePreview(data.conversation) };
    } catch (error) {
      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Get Messages -------------
export const GetMessages = createAsyncThunk(
  "message/get-messages",
  async (convoId, { rejectWithValue, dispatch, getState }) => {
    try {
      const { data } = await axios.get(`/message/get-messages/${convoId}`);
      const conversation = conversationById(getState(), convoId);
      const messages = await Promise.all(data.messages.map((message) => decryptMessage(message, conversation)));
      dispatch(AcknowledgeMessages(convoId));

      return { ...data, messages };
    } catch (error) {
      // show snackbar
      dispatch(
        ShowSnackbar({
          severity: error.error.status,
          message: error.error.message,
        })
      );
      return rejectWithValue(error.error);
    }
  }
);

// ------------- Send Text Message -------------
export const SendTextMessage = createAsyncThunk(
  "message/send-text",
  async (text, { rejectWithValue, dispatch, getState }) => {
    const { chat, user } = getState();
    const fail = (message) => {
      dispatch(ShowSnackbar({ severity: "error", message }));
      return rejectWithValue(message);
    };

    const cipher = await encryptMessage(text, chat.activeConversation, user.user._id).catch(() => null);
    if (!cipher) return fail("That message could not be encrypted. Reload Whisprl and try again.");

    const response = await socket
      .timeout(SEND_TIMEOUT)
      .emitWithAck("send_message", { convo_id: chat.activeConversation._id, cipher })
      .catch(() => ({ status: "error", message: "That message could not be sent. Check your connection and try again." }));
    if (response.status === "error") return fail(response.message);
  }
);

// ------------- Acknowledge Messages -------------
export const AcknowledgeMessages = createAsyncThunk("message/acknowledge", async (conversationId, { getState }) => {
  const { chat, encryption } = getState();
  const isRead =
    encryption.status === "ready" &&
    chat.activeConversation?._id === conversationId &&
    document.visibilityState === "visible";
  socket.emit(isRead ? "messages_seen" : "messages_delivered", conversationId);
});

// ------------- Receive Message -------------
export const ReceiveMessage = createAsyncThunk("message/receive", async (message, { dispatch, getState }) => {
  const readable = await decryptMessage(message, message.conversation);

  dispatch(updateMsgConvo({ ...readable, conversation: { ...message.conversation, latestMessage: readable } }));
  if (isFromSomeoneElse(message, getState)) dispatch(AcknowledgeMessages(message.conversation._id));
});

// ------------- Receive Re-encrypted Message -------------
export const ReceiveMessageUpdate = createAsyncThunk("message/receive-update", async (message, { dispatch, getState }) => {
  const conversation = conversationById(getState(), message.conversation);
  if (!conversation) return;

  dispatch(replaceMessage(await decryptMessage(message, conversation)));
  if (isFromSomeoneElse(message, getState)) dispatch(AcknowledgeMessages(conversation._id));
});

// ------------- Deliver Waiting Messages -------------
export const DeliverWaitingMessages = createAsyncThunk("message/deliver-waiting", async (_, { getState }) => {
  const userId = getState().user.user._id;
  const { data } = await axios.get("/message/deliverable");

  await Promise.all(
    data.messages.map(async (message) => {
      const readable = await decryptMessage(message, message.conversation);
      if (readable.undecryptable) return;

      const cipher = await encryptMessage(readable.message, message.conversation, userId);
      await axios.patch(`/message/${message._id}/reseal`, { cipher });
    })
  );
});

// ------------- Upload File Message (per-file, async) -------------
export const UploadFileMessage = createAsyncThunk(
  "message/upload-file-message",
  async (
    { file, convo_id, caption, localId, batchId, batchIndex, batchTotal, signal },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("convo_id", convo_id);
      if (caption) formData.append("message", caption);
      if (batchId) {
        formData.append("batchId", batchId);
        formData.append("batchIndex", batchIndex);
        formData.append("batchTotal", batchTotal);
      }

      const { data } = await axios.post("/message/send-message", formData, {
        signal,
      });

      dispatch(removePendingMessage(localId));
      return data;
    } catch (error) {
      // AbortError / CanceledError means user cancelled — keep status as 'cancelled'
      if (
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return rejectWithValue({ cancelled: true });
      }

      dispatch(updatePendingMessage({ localId, status: "failed" }));
      dispatch(
        ShowSnackbar({
          severity: "error",
          message: error?.error?.message || "Failed to upload file",
        })
      );
      return rejectWithValue(error?.error || error);
    }
  }
);
