import { createAsyncThunk } from "@reduxjs/toolkit";

import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import { ClearAttachments, PrepareQueued, UploadAttachment } from "@/redux/slices/actions/attachmentActions";
import {
  closeActiveConversation,
  countUnread,
  dropQueuedMessage,
  markRead,
  messageArrived,
  openConversation,
  pinsUpdated,
  queueMessage,
  removeMessage,
  replaceMessage,
  requeueMessage,
  setReplyingTo,
  updateQueuedMessage,
} from "@/redux/slices/chatSlice";
import { selectIsLoading } from "@/redux/slices/requestSlice";
import axios from "@/utils/axios";
import { socket } from "@/utils/socket";
import uuidv4 from "@/utils/uuidv4";
import { decryptMessage, encryptMessage, openMessage } from "@/utils/crypto/messageCipher";
import { markAttachmentSent, releaseAttachment } from "@/utils/attachments";
import { encodePayload } from "@/utils/messagePayload";
import { isMuted } from "@/utils/chats";
import { notifyArrival } from "@/utils/notifications";
import { playSound } from "@/utils/sounds";

const ACK_TIMEOUT = 10000;
// about a minute of trying while connected, and time offline does not count against it
const RETRY_PAUSES = [1000, 2000, 4000, 8000, 15000, 15000, 15000];
const UNREAD_LOOKBACK = 200;

const readablePins = (pins = [], conversation) =>
  Promise.all(pins.map(async (pin) => ({ ...pin, message: await decryptMessage(pin.message, conversation) })));

const readableConversation = async (conversation) => ({
  ...conversation,
  latestMessage: conversation.latestMessage && (await decryptMessage(conversation.latestMessage, conversation)),
  pins: await readablePins(conversation.pins, conversation),
});

export const conversationById = ({ chat }, conversationId) =>
  [chat.activeConversation, ...chat.conversations].find((conversation) => conversation?._id === conversationId);

const isFromSomeoneElse = (message, getState) => message.sender?._id !== getState().user.user._id;

const isWatching = (getState, conversationId) =>
  getState().chat.activeConversation?._id === conversationId && document.visibilityState === "visible";

// ------------- Get Conversation Thunk -------------
export const GetConversations = createApiThunk("conversation/get-conversations", async (_, { getState }) => {
  const arrivalsWhenAsked = getState().chat.arrivals;
  const { data } = await axios.get("/conversation/get-conversations");
  return { conversations: await Promise.all(data.conversations.map(readableConversation)), arrivalsWhenAsked };
});

// ------------- Create or Open Conversation -------------
export const CreateOpenConversation = createApiThunk(
  "conversation/create-open-conversation",
  async (receiver_id, { dispatch }) => {
    // closed first, so nothing typed while the request is out lands in the chat being left
    dispatch(CloseConversation());
    const { data } = await axios.post("/conversation/create-open-conversation", { receiver_id });
    return { ...data, conversation: await readableConversation(data.conversation) };
  }
);

export const readablePage = async (data, conversation) => ({
  messages: await Promise.all(data.messages.map((message) => decryptMessage(message, conversation))),
  hasMore: data.hasMore,
});

export const fetchPage = async (conversationId, params) =>
  (await axios.get(`/message/get-messages/${conversationId}`, { params })).data;

// a friend's message this browser had not seen when the chat opened; a group remembers how far each member read instead
const isUnreadBy = (userId, conversation) => (message) => {
  if (message.sender._id === userId || message.event) return false;
  if (conversation?.isGroup) return message._id > (conversation.lastSeen?.[userId] ?? "");
  return !message.seenAt && !message.awaitingKey;
};

// opening a chat reaches back far enough to show where the unread messages start
const fetchOpeningPages = async (conversationId, isUnread) => {
  let { messages, hasMore } = await fetchPage(conversationId);
  while (hasMore && messages.length < UNREAD_LOOKBACK && isUnread(messages[0])) {
    const older = await fetchPage(conversationId, { before: messages[0]._id });
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
  const isOpening = !getState().chat.hasFetched;
  const isUnread = isUnreadBy(getState().user.user._id, conversationById(getState(), convoId));

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
    const data = await fetchPage(activeConversation._id, { before: messages[0]?._id });
    return { conversationId: activeConversation._id, ...(await readablePage(data, activeConversation)) };
  },
  {
    condition: (_, { getState }) => {
      const { hasOlderMessages, activeConversation } = getState().chat;
      return Boolean(activeConversation && hasOlderMessages && !selectIsLoading(getState(), LoadOlderMessages));
    },
  }
);

// ------------- Load Newer Messages -------------
export const LoadNewerMessages = createApiThunk(
  "message/load-newer",
  async (_, { getState }) => {
    const { activeConversation, messages } = getState().chat;
    const data = await fetchPage(activeConversation._id, { after: messages.at(-1)?._id });
    return { conversationId: activeConversation._id, hasNewer: data.hasNewer, ...(await readablePage(data, activeConversation)) };
  },
  {
    condition: (_, { getState }) => {
      const { hasNewerMessages, activeConversation } = getState().chat;
      return Boolean(activeConversation && hasNewerMessages && !selectIsLoading(getState(), LoadNewerMessages));
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

// ------------- Open Conversation -------------
export const OpenConversation = (conversation) => (dispatch) => {
  dispatch(CloseConversation());
  dispatch(openConversation(conversation));
  dispatch(markRead(conversation._id));
};

// ------------- Close Conversation -------------
export const CloseConversation = () => (dispatch) => {
  dispatch(ClearAttachments());
  dispatch(closeActiveConversation());
};

// ------------- Send Text Message -------------
// shown at once from the outbox; the server's copy replaces it once it is saved
export const quoteOf = (message) => {
  if (!message) return null;
  const { _id, sender, message: text, file, contact, deletedAt } = message;
  return { _id, sender, message: text, file, contact, deletedAt };
};

export const SendTextMessage = ({ text, mentions, contact, forwardOf, file, conversationId }) => (dispatch, getState) => {
  const { chat, user } = getState();
  const targetId = conversationId ?? chat.activeConversation._id;
  const isHere = targetId === chat.activeConversation?._id;
  if (isHere && chat.hasNewerMessages) dispatch(GetMessages(targetId));

  dispatch(
    queueMessage({
      clientId: uuidv4(),
      senderId: user.user._id,
      conversationId: targetId,
      afterId: isHere ? chat.messages.at(-1)?._id : undefined,
      createdAt: new Date().toISOString(),
      text,
      mentions,
      contact,
      forwardOf,
      file,
      replyTo: isHere && !forwardOf ? quoteOf(chat.replyingTo) : null,
    })
  );
  if (isHere && !forwardOf) dispatch(setReplyingTo(null));
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
      replyTo: entry.replyTo?._id,
      forwardOf: entry.forwardOf,
      ...(entry.file && !entry.forwardOf && { attachment: true, batch: entry.batch, viewOnce: entry.viewOnce }),
    })
    .catch(() => null);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// an attachment's message carries its caption and the file's key, and the file follows once the message is saved
const plaintextOf = (entry) =>
  entry.file ? JSON.stringify({ caption: entry.caption ?? entry.text, file: entry.file }) : encodePayload(entry);

const confirmQueued = (entry, saved, dispatch) => {
  const { text, caption, file, mentions, contact, replyTo } = entry;
  dispatch(messageArrived({ ...saved, message: text ?? caption ?? "", file, mentions, contact, replyTo: replyTo ?? saved.replyTo, reactions: [] }));
  playSound("sent");
  if (!entry.file || entry.forwardOf) return;
  markAttachmentSent(entry.clientId, saved._id);
  dispatch(UploadAttachment(entry.clientId));
};

// a slow or busy server keeps the message sending, so a later one never overtakes it; only a refusal fails it
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

// a file still being encrypted holds its place, so nothing written after it goes first
const nextQueued = (getState) => getState().chat.outbox.find((queued) => queued.status === "sending" || queued.status === "preparing");

const drainOutbox = async (dispatch, getState) => {
  for (let entry = nextQueued(getState); entry?.status === "sending" && socket.connected; entry = nextQueued(getState)) {
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

// a file stopped before it was sealed is compressed and sealed again from the original
export const SendAgain = (clientId) => (dispatch, getState) => {
  const entry = getState().chat.outbox.find((queued) => queued.clientId === clientId);
  const needsPreparing = Boolean(entry?.file && !entry.file.key);
  dispatch(requeueMessage(clientId));
  dispatch(needsPreparing ? PrepareQueued(clientId) : FlushOutbox());
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

  const readable = await decryptMessage(message, conversation);
  dispatch(messageArrived(readable));
  if (!isFromSomeoneElse(message, getState)) return;
  dispatch(AcknowledgeMessages(conversation._id));
  if (message.event) return;

  const isWatched = isWatching(getState, conversation._id);
  if (!isWatched) dispatch(countUnread(conversation._id));
  if (isMuted(conversation)) return;
  playSound(isWatched ? "received" : "elsewhere");
  notifyArrival(readable, conversation);
};

// ------------- Pins Changed -------------
export const ReceivePins = ({ conversation_id, pins }) => async (dispatch, getState) => {
  const conversation = conversationById(getState(), conversation_id);
  if (conversation) dispatch(pinsUpdated({ conversation_id, pins: await readablePins(pins, conversation) }));
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
