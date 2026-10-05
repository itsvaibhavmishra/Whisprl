import { createAsyncThunk } from "@reduxjs/toolkit";

import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import { ClearAttachments, UploadAttachment } from "@/redux/slices/actions/attachmentActions";
import {
  closeActiveConversation,
  dropQueuedMessage,
  messageArrived,
  queueMessage,
  removeMessage,
  replaceMessage,
  requeueMessage,
  updateQueuedMessage,
} from "@/redux/slices/chatSlice";
import { selectIsLoading } from "@/redux/slices/requestSlice";
import axios from "@/utils/axios";
import { socket } from "@/utils/socket";
import uuidv4 from "@/utils/uuidv4";
import { decryptMessage, encryptMessage, openMessage } from "@/utils/crypto/messageCipher";
import { markAttachmentSent, releaseAttachment } from "@/utils/attachments";

const ACK_TIMEOUT = 10000;
// about a minute of trying while connected, and time offline does not count against it
const RETRY_PAUSES = [1000, 2000, 4000, 8000, 15000, 15000, 15000];
const UNREAD_LOOKBACK = 200;

const withReadablePreview = async (conversation) =>
  conversation.latestMessage
    ? { ...conversation, latestMessage: await decryptMessage(conversation.latestMessage, conversation) }
    : conversation;

const conversationById = ({ chat }, conversationId) =>
  [chat.activeConversation, ...chat.conversations].find((conversation) => conversation?._id === conversationId);

const isFromSomeoneElse = (message, getState) => message.sender?._id !== getState().user.user._id;

// ------------- Get Conversation Thunk -------------
export const GetConversations = createApiThunk("conversation/get-conversations", async () => {
  const { data } = await axios.get("/conversation/get-conversations");
  return { conversations: await Promise.all(data.conversations.map(withReadablePreview)) };
});

// ------------- Create or Open Conversation -------------
export const CreateOpenConversation = createApiThunk(
  "conversation/create-open-conversation",
  async (receiver_id, { dispatch }) => {
    const { data } = await axios.post("/conversation/create-open-conversation", { receiver_id });
    dispatch(CloseConversation());
    return { ...data, conversation: await withReadablePreview(data.conversation) };
  }
);

const readablePage = async (data, conversation) => ({
  messages: await Promise.all(data.messages.map((message) => decryptMessage(message, conversation))),
  hasMore: data.hasMore,
});

const fetchPage = async (conversationId, before) =>
  (await axios.get(`/message/get-messages/${conversationId}`, { params: { before } })).data;

// a friend's message this browser had not seen when the chat opened
const isUnreadBy = (userId) => (message) => message.sender._id !== userId && !message.seenAt && !message.awaitingKey;

// opening a chat reaches back far enough to show where the unread messages start
const fetchOpeningPages = async (conversationId, isUnread) => {
  let { messages, hasMore } = await fetchPage(conversationId);
  while (hasMore && messages.length < UNREAD_LOOKBACK && isUnread(messages[0])) {
    const older = await fetchPage(conversationId, messages[0]._id);
    messages = [...older.messages, ...messages];
    hasMore = older.hasMore;
  }
  return { messages, hasMore };
};

const unreadMarkerOf = (messages, isUnread) => {
  const unread = messages.filter(isUnread);
  return unread.length ? { firstId: unread[0]._id, count: unread.length } : null;
};

// ------------- Get Messages -------------
export const GetMessages = createApiThunk("message/get-messages", async (convoId, { dispatch, getState }) => {
  const isOpening = !getState().chat.messages.length;
  const isUnread = isUnreadBy(getState().user.user._id);

  const data = isOpening ? await fetchOpeningPages(convoId, isUnread) : await fetchPage(convoId);
  const page = await readablePage(data, conversationById(getState(), convoId));
  dispatch(AcknowledgeMessages(convoId));

  return { ...page, unread: isOpening ? unreadMarkerOf(data.messages, isUnread) : null };
});

// ------------- Load Older Messages -------------
export const LoadOlderMessages = createApiThunk(
  "message/load-older",
  async (_, { getState }) => {
    const { activeConversation, messages } = getState().chat;
    const data = await fetchPage(activeConversation._id, messages[0]?._id);
    return { conversationId: activeConversation._id, ...(await readablePage(data, activeConversation)) };
  },
  {
    condition: (_, { getState }) => {
      const { hasOlderMessages, activeConversation } = getState().chat;
      return Boolean(activeConversation && hasOlderMessages && !selectIsLoading(getState(), LoadOlderMessages));
    },
  }
);

// ------------- Acknowledge Messages -------------
export const AcknowledgeMessages = (conversationId) => (_, getState) => {
  const { chat, encryption } = getState();
  const isRead =
    encryption.status === "ready" &&
    chat.activeConversation?._id === conversationId &&
    document.visibilityState === "visible";
  socket.emit(isRead ? "messages_seen" : "messages_delivered", conversationId);
};

// ------------- Typing -------------
export const StartTyping = (conversationId) => () => socket.emit("start_typing", conversationId);

export const StopTyping = (conversationId) => () => socket.emit("stop_typing", conversationId);

// ------------- Close Conversation -------------
export const CloseConversation = () => (dispatch) => {
  dispatch(ClearAttachments());
  dispatch(closeActiveConversation());
};

// ------------- Send Text Message -------------
// shown at once from the outbox; the server's copy replaces it once it is saved
export const SendTextMessage = (text) => (dispatch, getState) => {
  dispatch(
    queueMessage({
      clientId: uuidv4(),
      senderId: getState().user.user._id,
      conversationId: getState().chat.activeConversation._id,
      afterId: getState().chat.messages.at(-1)?._id,
      createdAt: new Date().toISOString(),
      text,
    })
  );
  dispatch(FlushOutbox());
};

const UNENCRYPTABLE = "That message could not be encrypted. Reload Whisprl and try again.";

// null when the acknowledgement timed out; a resend carries the same clientId, so it is never saved twice
const sendOnce = (entry, cipher) =>
  socket
    .timeout(ACK_TIMEOUT)
    .emitWithAck("send_message", {
      convo_id: entry.conversationId,
      clientId: entry.clientId,
      cipher,
      ...(entry.file && { attachment: true, batch: entry.batch }),
    })
    .catch(() => null);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// a slow or busy server keeps the message sending, so a later one never overtakes it; only a refusal fails it
// an attachment's message carries its caption and the file's key, and the file follows once the message is saved
const plaintextOf = (entry) => entry.text ?? JSON.stringify({ caption: entry.caption, file: entry.file });

const confirmQueued = (entry, saved, dispatch) => {
  dispatch(messageArrived({ ...saved, message: entry.text ?? entry.caption ?? "", file: entry.file }));
  if (!entry.file) return;
  markAttachmentSent(entry.clientId, saved._id);
  dispatch(UploadAttachment(entry.clientId));
};

const deliverQueued = async (entry, dispatch, getState) => {
  const fail = (error) => dispatch(updateQueuedMessage({ clientId: entry.clientId, status: "failed", error }));
  const conversation = conversationById(getState(), entry.conversationId);

  const cipher = await encryptMessage(plaintextOf(entry), conversation, getState().user.user._id).catch(() => null);
  if (!cipher) return fail(UNENCRYPTABLE);

  for (const retryPause of [...RETRY_PAUSES, null]) {
    if (!socket.connected || !isStillSending(getState, entry.clientId)) return;

    const response = await sendOnce(entry, cipher);
    if (response?.status === "success") return confirmQueued(entry, response.message, dispatch);
    if (response && !response.retryable) return fail(response.message);
    if (retryPause) await pause(retryPause);
  }

  fail(null);
};

const isStillSending = (getState, clientId) =>
  getState().chat.outbox.some((queued) => queued.clientId === clientId && queued.status === "sending");

const nextQueued = (getState) => getState().chat.outbox.find((queued) => queued.status === "sending");

const drainOutbox = async (dispatch, getState) => {
  for (let entry = nextQueued(getState); entry && socket.connected; entry = nextQueued(getState)) {
    await deliverQueued(entry, dispatch, getState);
    // still sending means the connection dropped mid-send, and the reconnect flushes it again
    if (isStillSending(getState, entry.clientId)) return;
  }
};

let flushing = Promise.resolve();

// each flush waits for the one before, so messages go one at a time in the order they were written
export const FlushOutbox = () => (dispatch, getState) => {
  flushing = flushing.catch(() => {}).then(() => drainOutbox(dispatch, getState));
  return flushing;
};

export const SendAgain = (clientId) => (dispatch) => {
  dispatch(requeueMessage(clientId));
  dispatch(FlushOutbox());
};

export const DiscardMessage = (clientId) => (dispatch) => {
  dispatch(dropQueuedMessage(clientId));
  releaseAttachment(clientId);
};

// ------------- Receive Message -------------
export const ReceiveMessage = (message) => async (dispatch, getState) => {
  // a friend who just started a conversation with us sends a message before we have that conversation
  if (!conversationById(getState(), message.conversation)) await dispatch(GetConversations());
  const conversation = conversationById(getState(), message.conversation);
  if (!conversation) return;

  dispatch(messageArrived(await decryptMessage(message, conversation)));
  if (isFromSomeoneElse(message, getState)) dispatch(AcknowledgeMessages(conversation._id));
};

// ------------- Message Removed Before Its File Arrived -------------
export const RemovedMessage = (message) => (dispatch, getState) => {
  dispatch(removeMessage(message));
  const isPreview = conversationById(getState(), message.conversation)?.latestMessage?._id === message._id;
  if (isPreview) dispatch(GetConversations());
};

// ------------- Receive Re-encrypted Message -------------
export const ReceiveMessageUpdate = (message) => async (dispatch, getState) => {
  const conversation = conversationById(getState(), message.conversation);
  if (!conversation) return;

  dispatch(replaceMessage(await decryptMessage(message, conversation)));
  if (isFromSomeoneElse(message, getState)) dispatch(AcknowledgeMessages(conversation._id));
};

// ------------- Deliver Waiting Messages -------------
export const DeliverWaitingMessages = createAsyncThunk("message/deliver-waiting", async (_, { getState }) => {
  const userId = getState().user.user._id;
  const { data } = await axios.get("/message/deliverable");

  await Promise.all(
    data.messages.map(async (message) => {
      const plaintext = await openMessage(message, message.conversation).catch(() => null);
      if (plaintext === null) return;

      const cipher = await encryptMessage(plaintext, message.conversation, userId);
      await axios.patch(`/message/${message._id}/reseal`, { cipher });
    })
  );
});

// ------------- Catch Up After Reconnecting -------------
export const CatchUp = () => (dispatch, getState) => {
  dispatch(GetConversations());
  dispatch(DeliverWaitingMessages());
  const { activeConversation } = getState().chat;
  if (activeConversation) dispatch(GetMessages(activeConversation._id));
};
