import { createSlice, current } from "@reduxjs/toolkit";
import {
  CreateOpenConversation,
  GetConversations,
  GetMessages,
} from "@/redux/slices/actions/chatActions";

const initialState = {
  isLoading: false,
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

    replaceMessage: (state, action) => {
      const index = state.messages.findIndex((message) => message._id === action.payload._id);
      if (index !== -1) state.messages[index] = action.payload;

      const conversation = state.conversations.find((convo) => convo.latestMessage?._id === action.payload._id);
      if (conversation) conversation.latestMessage = action.payload;
    },

    // a reader's receipt covers every message in the conversation they did not send
    applyReceipt: (state, action) => {
      const { conversation_id, reader, receipt, at } = action.payload;
      if (state.activeConversation?._id !== conversation_id) return;

      state.messages
        .filter((message) => message.sender._id !== reader && !message.awaitingKey)
        .forEach((message) => {
          message.deliveredAt ??= at;
          if (receipt === "seen") message.seenAt ??= at;
        });
    },

    updateMemberKeys: (state, action) => {
      const { userId, publicKeys } = action.payload;
      const conversations = [...state.conversations, state.activeConversation].filter(Boolean);
      conversations
        .flatMap((conversation) => conversation.users)
        .filter((member) => member._id === userId)
        .forEach((member) => {
          member.publicKeys = publicKeys;
        });
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
        if (action.meta.arg !== state.activeConversation?._id) return;
        state.messages = action.payload.messages;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetMessages.rejected, (state) => {
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
  replaceMessage,
  applyReceipt,
  updateMemberKeys,
  updateTypingConvo,
  addFiles,
  clearFiles,
  removeFile,
  setActiveFileIndex,
  addPendingMessage,
  updatePendingMessage,
  removePendingMessage,
  addMessageFromUpload,
} = slice.actions;

export default slice.reducer;
