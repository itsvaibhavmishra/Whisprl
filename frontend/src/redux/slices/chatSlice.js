import { createSlice, current } from "@reduxjs/toolkit";
import {
  CreateOpenConversation,
  GetConversations,
  GetMessages,
  SendMessage,
} from "./actions/chatActions";

const initialState = {
  isOptimistic: true,
  isLoading: false,
  sendMsgLoading: false,
  error: false,

  conversations: [],
  activeConversation: null,
  activeConvoFriendship: null,
  notifications: [],

  messages: [],
  typingConversation: [],

  // file selection state (for upload preview screen)
  files: [],
  activeFileIndex: 0,

  // per-message upload tracking
  // { localId, batchId, batchIndex, batchTotal, dataUrl, fileName,
  //   actionType, caption, status, file, convo_id }
  // status: 'uploading' | 'failed' | 'cancelled'
  pendingMessages: [],
};

const slice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setIsOptimistic: (state, action) => {
      state.isOptimistic = action.payload.isOptimistic;
    },

    closeActiveConversation: (state) => {
      state.activeConversation = null;
      state.activeConvoFriendship = null;
      state.messages = [];
      state.files = [];
      state.activeFileIndex = 0;
      // don't clear pendingMessages here — they keep uploading even if conversation closes
    },

    clearConversation: (state) => {
      return initialState;
    },

    clearFiles: (state) => {
      state.files = [];
      state.activeFileIndex = 0;
    },

    removeFile: (state, action) => {
      state.files = state.files.filter((file) => file.fileName !== action.payload);
      if (state.activeFileIndex >= state.files.length) {
        state.activeFileIndex = Math.max(0, state.files.length - 1);
      }
    },

    setActiveFileIndex: (state, action) => {
      state.activeFileIndex = action.payload;
    },

    // ---------- Pending message reducers ----------
    addPendingMessage: (state, action) => {
      state.pendingMessages.push(action.payload);
    },

    updatePendingMessage: (state, action) => {
      const { localId, status } = action.payload;
      const index = state.pendingMessages.findIndex((m) => m.localId === localId);
      if (index !== -1) {
        state.pendingMessages[index].status = status;
      }
    },

    removePendingMessage: (state, action) => {
      state.pendingMessages = state.pendingMessages.filter(
        (m) => m.localId !== action.payload
      );
    },

    // Called by component after successful file upload — adds real message
    addMessageFromUpload: (state, action) => {
      const currentConvo = state.activeConversation;
      if (currentConvo?._id === action.payload.conversation._id) {
        state.messages = [...state.messages, action.payload];
      }
      const conversation = { ...action.payload.conversation };
      let newConvos = [...state.conversations].filter(
        (e) => e._id !== conversation._id
      );
      newConvos.unshift(conversation);
      state.conversations = newConvos;
    },

    // ---------- Socket / typing reducers ----------
    updateMsgConvo: (state, action) => {
      const currentConvo = state.activeConversation;
      if (currentConvo?._id === action.payload.conversation._id) {
        state.messages = [...state.messages, action.payload];
      }
      const conversation = { ...action.payload.conversation };
      let newConvos = [...state.conversations].filter(
        (e) => e._id !== conversation._id
      );
      newConvos.unshift(conversation);
      state.conversations = newConvos;
    },

    updateTypingConvo: (state, action) => {
      const { typing, conversation_id } = action.payload;
      const index = state.typingConversation.findIndex(
        (convo) => convo.conversation_id === conversation_id
      );
      if (index !== -1) {
        state.typingConversation[index].typing = typing;
      } else {
        state.typingConversation.push({ typing, conversation_id });
      }
    },

    addFiles: (state, action) => {
      const existingFiles = current(state.files);
      const isFilePresent = existingFiles.some(
        (existingFile) => existingFile?.fileName === action.payload.fileName
      );
      if (!isFilePresent) {
        state.files = [...state.files, action.payload];
      }
    },
  },
  extraReducers(builder) {
    builder
      .addCase(GetConversations.pending, (state) => {
        state.isLoading = true;
        state.error = false;
      })
      .addCase(GetConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetConversations.rejected, (state) => {
        state.isLoading = false;
        state.error = true;
      })

      .addCase(CreateOpenConversation.pending, (state) => {
        state.isLoading = true;
        state.error = false;
      })
      .addCase(CreateOpenConversation.fulfilled, (state, action) => {
        state.activeConversation = action.payload.conversation;
        state.activeConvoFriendship = action.payload.isValidFriendShip;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(CreateOpenConversation.rejected, (state) => {
        state.isLoading = false;
        state.error = true;
      })

      .addCase(GetMessages.pending, (state) => {
        state.error = false;
      })
      .addCase(GetMessages.fulfilled, (state, action) => {
        state.messages = action.payload.messages;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetMessages.rejected, (state) => {
        state.isLoading = false;
        state.error = true;
      })

      .addCase(SendMessage.pending, (state) => {
        state.error = false;
        state.sendMsgLoading = state.isOptimistic ? false : true;
      })
      .addCase(SendMessage.fulfilled, (state, action) => {
        if (!state.isOptimistic) {
          state.messages = [...state.messages, action.payload.message];
          const conversation = { ...action.payload.message.conversation };
          let newConvos = [...state.conversations].filter(
            (e) => e._id !== conversation._id
          );
          newConvos.unshift(conversation);
          state.conversations = newConvos;
        }
        state.sendMsgLoading = false;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(SendMessage.rejected, (state) => {
        state.sendMsgLoading = false;
        state.isLoading = false;
        state.error = true;
      });
  },
});

export function clearChat() {
  return async (dispatch) => {
    dispatch(slice.actions.clearConversation());
  };
}

export const {
  closeActiveConversation,
  updateMsgConvo,
  updateTypingConvo,
  addFiles,
  clearFiles,
  removeFile,
  setActiveFileIndex,
  addPendingMessage,
  updatePendingMessage,
  removePendingMessage,
  addMessageFromUpload,
  setIsOptimistic,
} = slice.actions;

export default slice.reducer;
