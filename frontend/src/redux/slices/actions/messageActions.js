import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import {
  SendTextMessage,
  conversationById,
  fetchPage,
  readablePage,
} from "@/redux/slices/actions/chatActions";
import {
  commonGroupsLoaded,
  historyLoaded,
  reactionChanged,
  removeMessage,
  setEditing,
  windowShown,
} from "@/redux/slices/chatSlice";
import { selectIsLoading } from "@/redux/slices/requestSlice";
import axios from "@/utils/axios";
import { encryptMessage, encryptReaction } from "@/utils/crypto/messageCipher";
import { encodePayload } from "@/utils/messagePayload";
import { myReactionOn } from "@/utils/reactions";

export const HISTORY_LIMIT = 2000;

// ------------- Edit -------------
export const EditMessage = createApiThunk("message/edit", async ({ message, text, mentions }, { dispatch, getState }) => {
  const conversation = conversationById(getState(), message.conversation);
  const cipher = await encryptMessage(encodePayload({ text, mentions }), conversation, getState().user.user._id);
  await axios.patch(`/message/${message._id}`, { cipher });
  dispatch(setEditing(null));
});

// ------------- Delete -------------
export const DeleteForEveryone = createApiThunk("message/delete-for-everyone", async (message) => {
  await axios.delete(`/message/${message._id}`);
});

export const DeleteForMe = createApiThunk("message/delete-for-me", async (message, { dispatch }) => {
  dispatch(removeMessage(message));
  await axios.post(`/message/${message._id}/hide`);
});

// ------------- React -------------
// choosing the reaction already there takes it off again
export const ReactToMessage = createApiThunk("message/react", async ({ message, emoji }, { dispatch, getState }) => {
  const userId = getState().user.user._id;
  const previous = myReactionOn(message, userId) ?? null;
  const next = previous === emoji ? null : emoji;
  const show = (shown) =>
    dispatch(reactionChanged({ conversationId: message.conversation, messageId: message._id, userId, emoji: shown }));

  show(next);
  try {
    if (!next) {
      await axios.delete(`/message/${message._id}/reaction`);
      return;
    }
    const conversation = conversationById(getState(), message.conversation);
    const cipher = await encryptReaction(next, message._id, conversation, userId);
    await axios.put(`/message/${message._id}/reaction`, { cipher });
  } catch (error) {
    show(previous);
    throw error;
  }
});

// ------------- Pins -------------
export const PinMessage = createApiThunk("message/pin", async (message) => {
  await axios.put(`/conversation/${message.conversation}/pins/${message._id}`);
});

export const UnpinMessage = createApiThunk("message/unpin", async (message) => {
  await axios.delete(`/conversation/${message.conversation}/pins/${message._id}`);
});

// ------------- Forward and Share -------------
// a forwarded file is not uploaded again: the server points the copy at the same encrypted file
export const ForwardMessage = ({ message, conversationIds }) => (dispatch) =>
  conversationIds.forEach((conversationId) =>
    dispatch(
      SendTextMessage({
        conversationId,
        text: message.message,
        file: message.file,
        contact: message.contact,
        forwardOf: message._id,
      })
    )
  );

export const ShareContacts = (friends) => (dispatch) =>
  friends.forEach(({ _id, firstName, lastName, username, avatar }) =>
    dispatch(SendTextMessage({ text: "", contact: { _id, firstName, lastName, username, avatar } }))
  );

// ------------- History -------------
// the server cannot read messages, so searching a chat means decrypting its history here
export const LoadHistory = createApiThunk(
  "message/history",
  async (conversationId, { dispatch, getState }) => {
    const conversation = conversationById(getState(), conversationId);
    let messages = [];
    let before;
    let hasMore = true;

    while (hasMore && messages.length < HISTORY_LIMIT) {
      const page = await fetchPage(conversationId, { before });
      messages = [...(await readablePage(page, conversation)).messages, ...messages];
      hasMore = page.hasMore;
      before = page.messages[0]?._id;
    }
    dispatch(historyLoaded({ conversationId, messages, isComplete: !hasMore }));
  },
  { condition: (conversationId, { getState }) => !getState().chat.history[conversationId] && !selectIsLoading(getState(), LoadHistory) }
);

const AROUND = 25;

// the decrypted history already holds the message when search found it, so only the stretch around it is shown
const windowFromHistory = (gathered, messageId, newestId) => {
  const index = gathered.messages.findIndex((message) => message._id === messageId);
  if (index === -1) return null;
  const messages = gathered.messages.slice(Math.max(0, index - AROUND), index + AROUND + 1);
  return {
    messages,
    hasOlderMessages: index > AROUND || !gathered.isComplete,
    hasNewerMessages: messages.at(-1)._id < newestId,
  };
};

// a jump shows the message with a page around it, rather than loading every page between here and there
export const RevealMessage = (messageId) => async (dispatch, getState) => {
  const { activeConversation: conversation, messages, history } = getState().chat;
  if (messages.some((message) => message._id === messageId)) return true;

  const newestId = [conversation.latestMessage?._id, messages.at(-1)?._id].filter(Boolean).sort().at(-1) ?? "";
  const fromHistory = history[conversation._id] && windowFromHistory(history[conversation._id], messageId, newestId);
  if (fromHistory) {
    dispatch(windowShown({ conversationId: conversation._id, ...fromHistory }));
    return true;
  }

  try {
    const page = await fetchPage(conversation._id, { around: messageId });
    if (!page.messages.some((message) => message._id === messageId)) return false;
    const { messages: readable } = await readablePage(page, conversation);
    dispatch(windowShown({ conversationId: conversation._id, messages: readable, hasOlderMessages: page.hasMore, hasNewerMessages: page.hasNewer }));
    return true;
  } catch {
    return false;
  }
};

// ------------- Groups In Common -------------
export const GetCommonGroups = createApiThunk("conversation/common-groups", async (userId, { dispatch }) => {
  const { data } = await axios.get(`/conversation/common-groups/${userId}`);
  dispatch(commonGroupsLoaded({ userId, groups: data.groups }));
});
