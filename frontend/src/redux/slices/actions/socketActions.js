import {
  CatchUp,
  DeliverWaitingMessages,
  FlushOutbox,
  ReceiveMessage,
  ReceivePins,
  RemovedMessage,
  ReceiveMessageUpdate,
} from "@/redux/slices/actions/chatActions";
import { applyReceipt, setConnection, updateMemberKeys, updateTypingConvo } from "@/redux/slices/chatSlice";
import { updateOnlineUsers } from "@/redux/slices/userSlice";
import { GroupUpdated } from "@/redux/slices/actions/groupActions";
import { ensureAccessToken, refreshAccessToken } from "@/utils/axiosInterceptors";
import { notify } from "@/utils/notify";
import { socket } from "@/utils/socket";

const MAX_HANDSHAKE_RETRIES = 2;

let isListening = false;
let hasConnected = false;
let handshakeRetries = 0;

// built when listening starts rather than on import, because these modules import each other
const serverEvents = () => ({
  message_received: ReceiveMessage,
  message_updated: ReceiveMessageUpdate,
  receipts: applyReceipt,
  online_friends: updateOnlineUsers,
  start_typing: updateTypingConvo,
  stop_typing: updateTypingConvo,
  pins_updated: ReceivePins,
});

const listen = (dispatch, getState) => {
  Object.entries(serverEvents()).forEach(([event, toAction]) => socket.on(event, (payload) => dispatch(toAction(payload))));

  socket.on("keys_changed", (keys) => {
    dispatch(updateMemberKeys(keys));
    if (keys.userId !== getState().user.user._id) dispatch(DeliverWaitingMessages());
  });

  socket.on("message_removed", (message) => dispatch(RemovedMessage(message)));

  socket.on("group_updated", (group) => dispatch(GroupUpdated(group)));

  socket.on("error", (error) => notify({ severity: "error", message: error.message }));

  socket.on("connect", () => {
    handshakeRetries = 0;
    dispatch(setConnection("connected"));
    if (hasConnected) dispatch(CatchUp());
    hasConnected = true;
    dispatch(FlushOutbox());
  });

  // socket.io retries a dropped connection by itself, but not one the server refused or closed
  const reconnectWithFreshToken = () => {
    if (handshakeRetries >= MAX_HANDSHAKE_RETRIES) return dispatch(setConnection("offline"));
    handshakeRetries += 1;
    refreshAccessToken()
      .then(() => socket.connect())
      .catch(() => dispatch(setConnection("offline")));
  };

  socket.on("disconnect", (reason) => {
    dispatch(setConnection("connecting"));
    if (reason === "io server disconnect") reconnectWithFreshToken();
  });

  socket.on("connect_error", () => {
    if (socket.active) return dispatch(setConnection(navigator.onLine ? "connecting" : "offline"));
    reconnectWithFreshToken();
  });
};

// ------------- Connect Socket -------------
export const ConnectSocket = () => async (dispatch, getState) => {
  if (!isListening) {
    listen(dispatch, getState);
    isListening = true;
  }
  if (socket.connected || socket.active) return;

  dispatch(setConnection("connecting"));
  await ensureAccessToken()
    .then(() => socket.connect())
    .catch(() => dispatch(setConnection("offline")));
};

// ------------- Disconnect Socket -------------
export const DisconnectSocket = () => () => {
  hasConnected = false;
  socket.disconnect();
};
