import { createAsyncThunk } from "@reduxjs/toolkit";

import { SetLoading, ShowSnackbar } from "../userSlice";

import axios from "../../../utils/axios";
import { socket } from "../../../utils/socket";
import { closeActiveConversation, updatePendingMessage, removePendingMessage } from "../chatSlice";

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

      // set user loading to false
      dispatch(SetLoading(false));
      return data;
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

      // emit join conversation to socket
      socket.emit("join_conversation", data.conversation._id);

      return data;
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
  async (convoId, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.get(`/message/get-messages/${convoId}`);

      return data;
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

// ------------- Send Message (text only) -------------
export const SendMessage = createAsyncThunk(
  "message/send-message",
  async (messageData, { rejectWithValue, dispatch, getState }) => {
    try {
      const { data } = await axios.post("/message/send-message", messageData);

      // For pessimistic mode, emit via socket
      if (!getState().chat.isOptimistic) {
        socket.emit("send_message", data.message);
      }
      return data;
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
