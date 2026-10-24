import {
  CatchUp,
  DeliverWaitingMessages,
  FlushOutbox,
  ReceiveMessage,
  ReceivePins,
  RemovedMessage,
  ReceiveAlbumUpdate,
  ReceiveMessageUpdate,
  ReceiveReactionPreview,
  ReceiveReceipt,
} from "@/redux/slices/actions/chatActions";
import { chatCleared, disappearingChanged, preferencesChanged, setConnection, updateMemberKeys, updateTypingConvo } from "@/redux/slices/chatSlice";
import { updateOnlineUsers } from "@/redux/slices/userSlice";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { statusRemoved, viewSaved } from "@/redux/slices/statusSlice";
import { FriendsChanged, GetRequests, RequestsChanged } from "@/redux/slices/actions/contactActions";
import { ReceiveGameInvite, ReceiveGameNotice, ReceiveGameReaction, WatchGame } from "@/redux/slices/actions/gameActions";
import { GroupUpdated } from "@/redux/slices/actions/groupActions";
import { gameStateReceived, lookersChanged } from "@/redux/slices/gameSlice";
import { ReceiveStatus, ReceiveStatusReaction } from "@/redux/slices/actions/statusActions";
import { notify } from "@/utils/notify";
import { dropAccessToken } from "@/utils/session";
import { socket } from "@/utils/socket";

const MAX_HANDSHAKE_RETRIES = 2;

let isListening = false;
let hasConnected = false;
let handshakeRetries = 0;

// built when listening starts rather than on import, because these modules import each other
const serverEvents = () => ({
  message_received: ReceiveMessage,
  message_updated: ReceiveMessageUpdate,
  album_updated: ReceiveAlbumUpdate,
  receipts: ReceiveReceipt,
  reaction_preview: ReceiveReactionPreview,
  online_friends: updateOnlineUsers,
  start_typing: updateTypingConvo,
  stop_typing: updateTypingConvo,
  pins_updated: ReceivePins,
  chat_preferences: preferencesChanged,
  chat_cleared: chatCleared,
  disappearing_changed: disappearingChanged,
  status_posted: ReceiveStatus,
  status_removed: statusRemoved,
  status_viewed: viewSaved,
  status_reacted: ReceiveStatusReaction,
  friend_requests_changed: RequestsChanged,
  friends_changed: FriendsChanged,
  game_state: gameStateReceived,
  game_invited: ReceiveGameInvite,
  game_notice: ReceiveGameNotice,
  game_lookers: lookersChanged,
  game_reaction: ReceiveGameReaction,
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
    // a request answered while this tab was away sent its event to nobody, so friends are fetched again too
    if (hasConnected) {
      dispatch(CatchUp());
      dispatch(GetFriends());
    }
    // a watch sent before the first connection can time out unsent, and the server forgets a socket that drops
    const { watching } = getState().game;
    if (watching) dispatch(WatchGame(watching));
    hasConnected = true;
    dispatch(FlushOutbox());
    dispatch(GetRequests());
  });

  // socket.io retries a dropped connection by itself, but not one the server refused or closed, so this retries with a renewed token
  const reconnectWithFreshToken = () => {
    if (handshakeRetries >= MAX_HANDSHAKE_RETRIES) return dispatch(setConnection("offline"));
    handshakeRetries += 1;
    dropAccessToken();
    socket.connect();
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

export const ConnectSocket = () => (dispatch, getState) => {
  if (!isListening) {
    listen(dispatch, getState);
    isListening = true;
  }
  if (socket.connected || socket.active) return;

  dispatch(setConnection("connecting"));
  socket.connect();
};

export const DisconnectSocket = () => () => {
  hasConnected = false;
  socket.disconnect();
};
