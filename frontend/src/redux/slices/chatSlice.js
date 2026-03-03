import { createSlice, current } from "@reduxjs/toolkit";
import {
  CreateOpenConversation,
  GetConversations,
  GetMessages,
  SendMessage,
} from "./actions/chatActions";

// initial state for contacts menu
const initialState = {
  isOptimistic: true, // default approach set to optimistic
  isLoading: false,
  sendMsgLoading: false,
  error: false,

  conversations: [],
  activeConversation: null,
  activeConvoFriendship: null,
  notifications: [],

  messages: [],
  typingConversation: [],

  files: [],
};

const slice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // update approach to use (true: Optimistic, false: Pessimistic)
    setIsOptimistic: (state, action) => {
      state.isOptimistic = action.payload.isOptimistic;
    },

    // close active conversation
    closeActiveConversation: (state, action) => {
      state.activeConversation = null;
      state.activeConvoFriendship = null;
      state.messages = [];
      state.files = [];
    },

    // clear conversation
    clearConversation: (state, action) => {
      state = initialState;
    },

    // clear files
    clearFiles: (state, action) => {
      state.files = [];
    },

    // update messages from socket
    updateMsgConvo: (state, action) => {
      const currentConvo = state.activeConversation;

      // updating messages
      if (currentConvo?._id === action.payload.conversation._id) {
        state.messages = [...state.messages, action.payload];
      }
      // update conversations
      const conversation = {
        ...action.payload.conversation,
      };
      let newConvos = [...state.conversations].filter(
        (e) => e._id !== conversation._id
      );
      newConvos.unshift(conversation);

      state.conversations = newConvos;
    },

    // update typing state from socket
    updateTypingConvo: (state, action) => {
      const { typing, conversation_id } = action.payload;

      const index = state.typingConversation.findIndex(
        (convo) => convo.conversation_id === conversation_id
      );

      if (index !== -1) {
        // If typing data is present for that convo
        state.typingConversation[index].typing = typing;
      } else {
        // If typing data doesn't exist
        state.typingConversation.push({
          typing,
          conversation_id,
        });
      }
    },

    // add list of files for chat
    addFiles: (state, action) => {
      const existingFiles = current(state.files);

      // Check if the file is already present
      const isFilePresent = existingFiles.some(
        (existingFile) => existingFile?.fileName === action.payload.fileName
      );

      // If the file is not present, add it to the state
      if (!isFilePresent) {
        state.files = [...state.files, action.payload];
      }
    },
  },
  extraReducers(builder) {
    builder
      // --------- Get Conversations Builder ---------
      .addCase(GetConversations.pending, (state, action) => {
        state.isLoading = true;
        state.error = false;
      })
      .addCase(GetConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = true;
      })
      // --------- Create Open Conversation Builder ---------
      .addCase(CreateOpenConversation.pending, (state, action) => {
        state.isLoading = true;
        state.error = false;
      })
      .addCase(CreateOpenConversation.fulfilled, (state, action) => {
        state.activeConversation = action.payload.conversation;
        state.activeConvoFriendship = action.payload.isValidFriendShip;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(CreateOpenConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = true;
      })

      // --------- Get Messages Builder ---------
      .addCase(GetMessages.pending, (state, action) => {
        state.error = false;
      })
      .addCase(GetMessages.fulfilled, (state, action) => {
        state.messages = action.payload.messages;
        state.isLoading = false;
        state.error = false;
      })
      .addCase(GetMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = true;
      })

      // --------- Send Message Builder ---------
      .addCase(SendMessage.pending, (state, action) => {
        state.error = false;
        state.sendMsgLoading = state.isOptimistic ? false : true; //change to true for Pessimistic Approach
      })
      .addCase(SendMessage.fulfilled, (state, action) => {
        // Uncomment for Pessimistic Approach

        if (!state.isOptimistic) {
          // updating messages list
          state.messages = [...state.messages, action.payload.message];

          // updating conversations
          const conversation = {
            ...action.payload.message.conversation,
          };
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
      .addCase(SendMessage.rejected, (state, action) => {
        state.sendMsgLoading = false;
        state.isLoading = false;
        state.error = true;
      });
  },
});

// snackbar functions
export function clearChat() {
  return async (dispatch, getState) => {
    dispatch(slice.actions.clearConversation());
  };
}

export const {
  closeActiveConversation,
  updateMsgConvo,
  updateTypingConvo,
  addFiles,
  clearFiles,
  // --------- Optimistic Approach ---------
  setIsOptimistic,
  // ---------------------------------------
} = slice.actions;

export default slice.reducer;
