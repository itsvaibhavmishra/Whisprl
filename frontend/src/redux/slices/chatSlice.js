import { createSelector, createSlice } from "@reduxjs/toolkit";
import {
  CreateOpenConversation,
  GetConversations,
  GetMessages,
  LoadOlderMessages,
} from "@/redux/slices/actions/chatActions";

const initialState = {
  conversations: [],
  activeConversation: null,
  activeConvoFriendship: null,

  messages: [],
  hasOlderMessages: false,
  // worked out when the chat opens, because opening it marks those messages seen
  unreadMarker: null,

  // sent from this tab and not yet confirmed by the server, oldest first: text carries `text`, a file `attachment`
  outbox: [],

  typingConversation: [],
  connection: "connecting",

  // attachments chosen for the next message; the files themselves are held outside the store
  files: [],
  activeFileIndex: 0,
};

const isSameMessage = (message, other) =>
  message._id === other._id ||
  Boolean(message.clientId && message.clientId === other.clientId && message.sender._id === other.sender._id);

// a chat opened from search is not in the list until its first message, so that message adds it
const moveConversationToTop = (state, conversationId, latestMessage) => {
  const isActive = state.activeConversation?._id === conversationId;
  const conversation =
    state.conversations.find((convo) => convo._id === conversationId) ?? (isActive && { ...state.activeConversation });
  if (!conversation) return;

  if (!conversation.latestMessage || conversation.latestMessage._id <= latestMessage._id) {
    conversation.latestMessage = latestMessage;
  }
  state.conversations = [conversation, ...state.conversations.filter((convo) => convo._id !== conversationId)];
};

const slice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    closeActiveConversation: (state) => {
      state.activeConversation = null;
      state.activeConvoFriendship = null;
      state.messages = [];
      state.hasOlderMessages = false;
      state.unreadMarker = null;
      state.files = [];
      state.activeFileIndex = 0;
    },

    clearConversation: () => initialState,

    setConnection: (state, action) => {
      state.connection = action.payload;
      // a stop_typing sent while this tab was away never arrives, so nobody is left typing forever
      if (action.payload !== "connected") state.typingConversation = [];
    },

    // ---------- Draft attachments ----------
    addFiles: (state, action) => {
      state.files.push(action.payload);
    },

    removeFile: (state, action) => {
      state.files = state.files.filter((file) => file.id !== action.payload);
      state.activeFileIndex = Math.min(state.activeFileIndex, Math.max(0, state.files.length - 1));
    },

    clearFiles: (state) => {
      state.files = [];
      state.activeFileIndex = 0;
    },

    setActiveFileIndex: (state, action) => {
      state.activeFileIndex = action.payload;
    },

    // ---------- Outbox ----------
    queueMessage: (state, action) => {
      state.outbox.push({ status: "sending", error: null, ...action.payload });
    },

    // sending again makes it a new message, so it moves to the end, after anything written since
    requeueMessage: (state, action) => {
      const entry = state.outbox.find((queued) => queued.clientId === action.payload);
      if (!entry) return;
      state.outbox = [
        ...state.outbox.filter((queued) => queued !== entry),
        { ...entry, status: "sending", error: null, createdAt: new Date().toISOString(), afterId: state.messages.at(-1)?._id },
      ];
    },

    updateQueuedMessage: (state, action) => {
      const { clientId, ...changes } = action.payload;
      const entry = state.outbox.find((queued) => queued.clientId === clientId);
      if (entry) Object.assign(entry, changes);
    },

    dropQueuedMessage: (state, action) => {
      state.outbox = state.outbox.filter((queued) => queued.clientId !== action.payload);
    },

    // the server's copy, whether it came back as an acknowledgement, an echo or a friend's message
    messageArrived: (state, action) => {
      const message = action.payload;
      const conversationId = message.conversation;

      state.outbox = state.outbox.filter(
        (queued) => queued.clientId !== message.clientId || queued.senderId !== message.sender._id
      );
      moveConversationToTop(state, conversationId, message);

      if (state.activeConversation?._id !== conversationId) return;
      const index = state.messages.findIndex((existing) => isSameMessage(existing, message));
      if (index !== -1) {
        state.messages[index] = message;
        return;
      }
      const after = state.messages.findLastIndex((existing) => existing._id < message._id);
      state.messages.splice(after + 1, 0, message);
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
  },
  extraReducers(builder) {
    builder
      .addCase(GetConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
      })
      .addCase(CreateOpenConversation.fulfilled, (state, action) => {
        state.activeConversation = action.payload.conversation;
        state.activeConvoFriendship = action.payload.isValidFriendShip;
      })

      // the newest page, joined onto older pages already loaded when the two overlap
      .addCase(GetMessages.fulfilled, (state, action) => {
        if (action.meta.arg !== state.activeConversation?._id) return;
        const { messages, hasMore, unread } = action.payload;
        if (unread) state.unreadMarker = unread;

        const overlaps = messages.some((fetched) => state.messages.some((loaded) => loaded._id === fetched._id));
        const olderLoaded = overlaps ? state.messages.filter((loaded) => loaded._id < messages[0]._id) : [];
        // a message that arrived while the page was on its way is newer than all of it
        const arrivedSince = state.messages.filter((loaded) => !messages.length || loaded._id > messages.at(-1)._id);

        state.messages = [...olderLoaded, ...messages, ...arrivedSince];
        state.hasOlderMessages = olderLoaded.length ? state.hasOlderMessages : hasMore;
      })
      .addCase(LoadOlderMessages.fulfilled, (state, action) => {
        if (action.payload.conversationId !== state.activeConversation?._id) return;
        const known = new Set(state.messages.map((message) => message._id));
        state.messages = [...action.payload.messages.filter((message) => !known.has(message._id)), ...state.messages];
        state.hasOlderMessages = action.payload.hasMore;
      });
  },
});

export const selectActiveOutbox = createSelector(
  [(state) => state.chat.outbox, (state) => state.chat.activeConversation?._id],
  (outbox, conversationId) => outbox.filter((queued) => queued.conversationId === conversationId)
);

export const {
  closeActiveConversation,
  clearConversation: clearChat,
  setConnection,
  addFiles,
  removeFile,
  clearFiles,
  setActiveFileIndex,
  queueMessage,
  requeueMessage,
  updateQueuedMessage,
  dropQueuedMessage,
  messageArrived,
  replaceMessage,
  applyReceipt,
  updateMemberKeys,
  updateTypingConvo,
} = slice.actions;

export default slice.reducer;
