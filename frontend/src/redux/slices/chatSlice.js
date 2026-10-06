import { createSelector, createSlice } from "@reduxjs/toolkit";
import {
  CreateOpenConversation,
  GetConversations,
  GetMessages,
  LoadNewerMessages,
  LoadOlderMessages,
} from "@/redux/slices/actions/chatActions";

const initialState = {
  conversations: [],
  activeConversation: null,
  activeConvoFriendship: null,

  messages: [],
  hasOlderMessages: false,
  // true while an older stretch of the chat is shown after jumping to a message, with newer pages yet to load
  hasNewerMessages: false,
  // worked out when the chat opens, because opening it marks those messages seen
  unreadMarker: null,

  // sent from this tab and not yet confirmed by the server, oldest first: text carries `text`, a file `file`
  outbox: [],
  // this tab's attachments whose message was saved but whose file did not upload, by clientId
  failedUploads: [],
  // how far each of this tab's files has got through compressing and uploading, in percent, by clientId
  transfers: {},

  typingConversation: [],
  connection: "connecting",

  // attachments chosen for the next message; the files themselves are held outside the store
  files: [],
  activeFileIndex: 0,

  // chats left recently keep their decrypted messages in memory, so going back to one is instant
  cache: {},
  hasFetched: false,
  drafts: {},
  replyingTo: null,
  editing: null,
  // a reply, pin or search result asks the chat to bring this message into view
  focusedMessageId: null,
  isDetailsOpen: false,
  // every decrypted message of a chat, gathered for searching it and listing its media, links and documents
  history: {},
  commonGroups: {},
};

const CACHED_CHATS = 15;

const closedConversation = () => ({
  activeConversation: null,
  activeConvoFriendship: null,
  messages: [],
  hasOlderMessages: false,
  hasNewerMessages: false,
  unreadMarker: null,
  files: [],
  activeFileIndex: 0,
  hasFetched: false,
  replyingTo: null,
  editing: null,
  focusedMessageId: null,
});

const cacheActive = (state) => {
  const conversationId = state.activeConversation?._id;
  if (!conversationId || !state.messages.length) return;
  delete state.cache[conversationId];
  state.cache[conversationId] = {
    messages: state.messages,
    hasOlderMessages: state.hasOlderMessages,
    hasNewerMessages: state.hasNewerMessages,
  };
  const cached = Object.keys(state.cache);
  if (cached.length > CACHED_CHATS) delete state.cache[cached[0]];
};

const PREFERENCE_KEYS = ["mutedUntil", "isFavourite", "isArchived", "clearedAt"];

// a chat's own settings live only in the list, so a copy from anywhere else picks them up from there
const preferencesIn = (conversation) =>
  Object.fromEntries(PREFERENCE_KEYS.filter((key) => conversation?.[key] !== undefined).map((key) => [key, conversation[key]]));

const open = (state, conversation, canMessage) => {
  const cached = state.cache[conversation._id];
  const listed = state.conversations.find((candidate) => candidate._id === conversation._id);
  state.activeConversation = { ...conversation, ...preferencesIn(listed) };
  state.activeConvoFriendship = canMessage;
  state.messages = cached?.messages ?? [];
  state.hasOlderMessages = cached?.hasOlderMessages ?? false;
  state.hasNewerMessages = cached?.hasNewerMessages ?? false;
};

// the open chat's messages, or a cached chat's, so a change lands wherever that chat is shown next
const messagesOf = (state, conversationId) =>
  state.activeConversation?._id === conversationId ? state.messages : state.cache[conversationId]?.messages;

// edits and deletions reach the gathered history too, so search and shared media never show what is gone
const listsOf = (state, conversationId) =>
  [messagesOf(state, conversationId), state.history[conversationId]?.messages].filter(Boolean);

const conversationsWith = (state, conversationId) =>
  [state.activeConversation, ...state.conversations].filter((conversation) => conversation?._id === conversationId);

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
      cacheActive(state);
      Object.assign(state, closedConversation());
    },

    clearConversation: () => initialState,

    openConversation: (state, action) => {
      open(state, action.payload, action.payload.canMessage ?? true);
    },

    countUnread: (state, action) => {
      conversationsWith(state, action.payload).forEach((conversation) => {
        conversation.unread = (conversation.unread ?? 0) + 1;
      });
    },

    markRead: (state, action) => {
      conversationsWith(state, action.payload).forEach((conversation) => {
        conversation.unread = 0;
      });
    },

    preferencesChanged: (state, action) => {
      const { conversation_id, ...preferences } = action.payload;
      conversationsWith(state, conversation_id).forEach((conversation) => Object.assign(conversation, preferences));
    },

    // a cleared chat drops everything this tab holds of it, so nothing from before shows again
    chatCleared: (state, action) => {
      const { conversation_id, ...preferences } = action.payload;
      conversationsWith(state, conversation_id).forEach((conversation) =>
        Object.assign(conversation, preferences, { latestMessage: null, unread: 0 })
      );
      delete state.cache[conversation_id];
      delete state.history[conversation_id];
      if (state.activeConversation?._id === conversation_id) Object.assign(state, { messages: [], hasOlderMessages: false, hasNewerMessages: false });
    },

    disappearingChanged: (state, action) => {
      const { conversation_id, disappearAfter } = action.payload;
      conversationsWith(state, conversation_id).forEach((conversation) => {
        conversation.disappearAfter = disappearAfter;
      });
    },

    pinsUpdated: (state, action) => {
      const { conversation_id, pins } = action.payload;
      conversationsWith(state, conversation_id).forEach((conversation) => {
        conversation.pins = pins;
      });
    },

    // ---------- Composer ----------
    setDraft: (state, action) => {
      const { conversationId, text } = action.payload;
      if (text) state.drafts[conversationId] = text;
      else delete state.drafts[conversationId];
    },

    setReplyingTo: (state, action) => {
      state.replyingTo = action.payload;
      state.editing = null;
    },

    setEditing: (state, action) => {
      state.editing = action.payload;
      state.replyingTo = null;
    },

    // shown at once, and replaced by the server's copy when it echoes back
    reactionChanged: (state, action) => {
      const { conversationId, messageId, userId, emoji } = action.payload;
      const message = messagesOf(state, conversationId)?.find((candidate) => candidate._id === messageId);
      if (!message) return;
      const others = (message.reactions ?? []).filter((reaction) => reaction.user !== userId);
      message.reactions = emoji ? [...others, { user: userId, emoji }] : others;
    },

    windowShown: (state, action) => {
      const { conversationId, messages, hasOlderMessages, hasNewerMessages } = action.payload;
      if (state.activeConversation?._id !== conversationId) return;
      Object.assign(state, { messages, hasOlderMessages, hasNewerMessages, unreadMarker: null });
    },

    focusMessage: (state, action) => {
      state.focusedMessageId = action.payload;
    },

    setDetailsOpen: (state, action) => {
      state.isDetailsOpen = action.payload;
    },

    historyLoaded: (state, action) => {
      const { conversationId, messages, isComplete } = action.payload;
      state.history[conversationId] = { messages, isComplete };
    },

    commonGroupsLoaded: (state, action) => {
      const { userId, groups } = action.payload;
      state.commonGroups[userId] = groups;
    },

    // a group arrives without its preview or readable pins, which this tab already holds
    groupUpdated: (state, action) => {
      const { group, userId } = action.payload;
      const index = state.conversations.findIndex((conversation) => conversation._id === group._id);
      const isMember = group.users.some((member) => member._id === userId);

      if (!isMember) {
        if (index !== -1) state.conversations.splice(index, 1);
        if (state.activeConversation?._id === group._id) Object.assign(state, closedConversation());
        return;
      }

      const previous = state.conversations[index];
      const updated = {
        ...group,
        ...preferencesIn(previous),
        latestMessage: previous?.latestMessage ?? null,
        pins: previous?.pins ?? [],
        unread: previous?.unread ?? 0,
      };
      if (index === -1) state.conversations.unshift(updated);
      else state.conversations[index] = updated;
      if (state.activeConversation?._id === group._id) state.activeConversation = { ...updated };
    },

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
      state.typingConversation = state.typingConversation.filter(
        (typist) => typist.conversation_id !== conversationId || typist.user_id !== message.sender._id
      );

      const messages = messagesOf(state, conversationId);
      // a new message belongs after the newest one, which an older stretch on screen does not reach
      const isShowingOlder = state.activeConversation?._id === conversationId && state.hasNewerMessages;
      if (!messages || isShowingOlder) return;
      const index = messages.findIndex((existing) => isSameMessage(existing, message));
      if (index !== -1) {
        messages[index] = message;
        return;
      }
      const after = messages.findLastIndex((existing) => existing._id < message._id);
      messages.splice(after + 1, 0, message);
    },

    transferProgress: (state, action) => {
      state.transfers[action.payload.clientId] = action.payload.percent;
    },

    transferEnded: (state, action) => {
      delete state.transfers[action.payload];
    },

    markUploadFailed: (state, action) => {
      if (!state.failedUploads.includes(action.payload)) state.failedUploads.push(action.payload);
    },

    clearUploadFailed: (state, action) => {
      state.failedUploads = state.failedUploads.filter((clientId) => clientId !== action.payload);
    },

    removeMessage: (state, action) => {
      const { _id, conversation } = action.payload;
      listsOf(state, conversation).forEach((messages) => {
        const index = messages.findIndex((message) => message._id === _id);
        if (index !== -1) messages.splice(index, 1);
      });
      conversationsWith(state, conversation).forEach((chat) => {
        chat.pins = (chat.pins ?? []).filter((pin) => pin.message?._id !== _id);
      });
    },

    replaceMessage: (state, action) => {
      listsOf(state, action.payload.conversation).forEach((messages) => {
        const index = messages.findIndex((message) => message._id === action.payload._id);
        if (index !== -1) messages[index] = action.payload;
      });

      const conversation = state.conversations.find((convo) => convo.latestMessage?._id === action.payload._id);
      if (conversation) conversation.latestMessage = action.payload;
    },

    // a reader's receipt covers every message in the conversation they did not send
    applyReceipt: (state, action) => {
      const { conversation_id, reader, receipt, at, upTo } = action.payload;
      if (upTo) {
        conversationsWith(state, conversation_id).forEach((conversation) => {
          conversation.lastSeen = { ...conversation.lastSeen, [reader]: upTo };
        });
        return;
      }
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
      const { typing, conversation_id, user_id } = action.payload;
      const typist = state.typingConversation.find(
        (convo) => convo.conversation_id === conversation_id && convo.user_id === user_id
      );
      if (typist) typist.typing = typing;
      else state.typingConversation.push({ typing, conversation_id, user_id });
    },
  },
  extraReducers(builder) {
    builder
      .addCase(GetConversations.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
        const active = state.conversations.find((conversation) => conversation._id === state.activeConversation?._id);
        if (active) state.activeConvoFriendship = active.canMessage;
      })
      .addCase(CreateOpenConversation.fulfilled, (state, action) => {
        open(state, action.payload.conversation, action.payload.isValidFriendShip);
      })

      // the newest page, joined onto older pages already loaded when the two overlap
      .addCase(GetMessages.fulfilled, (state, action) => {
        if (action.meta.arg !== state.activeConversation?._id) return;
        const { messages, hasMore, unread } = action.payload;
        if (unread) state.unreadMarker = unread;
        state.hasFetched = true;
        state.hasNewerMessages = false;

        const overlaps = messages.some((fetched) => state.messages.some((loaded) => loaded._id === fetched._id));
        const olderLoaded = overlaps ? state.messages.filter((loaded) => loaded._id < messages[0]._id) : [];
        // a message that arrived while the page was on its way is newer than all of it
        const arrivedSince = state.messages.filter((loaded) => !messages.length || loaded._id > messages.at(-1)._id);

        state.messages = [...olderLoaded, ...messages, ...arrivedSince];
        state.hasOlderMessages = olderLoaded.length ? state.hasOlderMessages : hasMore;
      })
      .addCase(LoadNewerMessages.fulfilled, (state, action) => {
        if (action.payload.conversationId !== state.activeConversation?._id) return;
        const known = new Set(state.messages.map((message) => message._id));
        state.messages = [...state.messages, ...action.payload.messages.filter((message) => !known.has(message._id))];
        state.hasNewerMessages = action.payload.hasNewer;
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
  openConversation,
  countUnread,
  markRead,
  pinsUpdated,
  preferencesChanged,
  chatCleared,
  disappearingChanged,
  setDraft,
  setReplyingTo,
  setEditing,
  reactionChanged,
  focusMessage,
  windowShown,
  setDetailsOpen,
  historyLoaded,
  commonGroupsLoaded,
  groupUpdated,
  clearConversation: clearChat,
  setConnection,
  addFiles,
  removeFile,
  transferProgress,
  transferEnded,
  clearFiles,
  setActiveFileIndex,
  queueMessage,
  requeueMessage,
  updateQueuedMessage,
  dropQueuedMessage,
  messageArrived,
  markUploadFailed,
  clearUploadFailed,
  removeMessage,
  replaceMessage,
  applyReceipt,
  updateMemberKeys,
  updateTypingConvo,
} = slice.actions;

export default slice.reducer;
