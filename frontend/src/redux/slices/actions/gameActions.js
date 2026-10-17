import { createApiThunk } from "@/redux/slices/actions/apiThunk";
import { seatSwitchOffered } from "@/redux/slices/gameSlice";
import axios from "@/utils/axios";
import { firstNameIn } from "@/utils/groups";
import { notify } from "@/utils/notify";
import { socket } from "@/utils/socket";

const ACK_TIMEOUT = 10 * 1000;

// a refusal is rejected in the shape a failed request has, so it reads the same everywhere
const emitGameEvent = (event, ...args) =>
  socket
    .timeout(ACK_TIMEOUT)
    .emitWithAck(event, ...args)
    .catch(() => ({ status: "error", message: "Could not reach Whisprl" }))
    .then((reply) => (reply.status === "error" ? Promise.reject({ error: reply }) : reply));

// someone already playing elsewhere is asked whether to leave that game, rather than refused
const sitOrOfferSwitch = (dispatch, action) =>
  emitGameEvent("game_act", action).catch((error) => {
    if (error.error?.details?.code !== "seated_elsewhere") return Promise.reject(error);
    dispatch(seatSwitchOffered({ elsewhere: error.error.details, action }));
    return null;
  });

export const WatchGame = createApiThunk("game/watch", (conversationId) => emitGameEvent("game_watch", conversationId), { notifyErrors: false });

export const UnwatchGame = createApiThunk("game/unwatch", () => emitGameEvent("game_unwatch"), { notifyErrors: false });

export const ActInGame = createApiThunk("game/act", (action) => emitGameEvent("game_act", action));

// the game leaves the screen before the server answers; if it refuses, watching again brings the game back
export const CloseGame = createApiThunk("game/close", (conversationId, { dispatch }) =>
  emitGameEvent("game_act", { conversationId, type: "close" }).catch((error) => {
    dispatch(WatchGame(conversationId));
    return Promise.reject(error);
  })
);

export const GetLeaderboard = createApiThunk("game/leaderboard", async (conversationId) => ({
  conversationId,
  rows: (await axios.get(`/games/${conversationId}/leaderboard`)).data.leaderboard,
}));

export const TakeSeat = createApiThunk("game/takeSeat", (seat, { dispatch }) => sitOrOfferSwitch(dispatch, { ...seat, type: "sit" }));

export const AnswerInvite = createApiThunk("game/answerInvite", (answer, { dispatch }) => {
  const action = { ...answer, type: "answer" };
  return answer.accept ? sitOrOfferSwitch(dispatch, action) : emitGameEvent("game_act", action);
});

export const SwitchSeat = createApiThunk("game/switchSeat", async ({ elsewhere, action }) => {
  await emitGameEvent("game_act", { conversationId: elsewhere.conversationId, type: "stand" });
  return emitGameEvent("game_act", action);
});

// an invite to the chat on screen shows on its seat, so only one to another chat needs a word
export const ReceiveGameInvite = (invite) => async (_, getState) => {
  const { chat, game, user } = getState();
  const conversation = chat.conversations.find((listed) => listed._id === invite.conversationId);
  if (game.watching === invite.conversationId || !conversation) return;
  const from = firstNameIn(conversation, invite.from, user.user._id);
  // asked for here rather than imported, so naming a game in a toast does not put every game in the first bundle
  const { GAMES } = await import("@/sections/chat/game/catalog");
  notify({ severity: "info", message: `${from} saved you a seat at ${GAMES[invite.game]?.name ?? "a game"} in ${conversation.name}` });
};

export const ReceiveGameNotice = (notice) => (_, getState) => {
  const { chat, user } = getState();
  const conversation = chat.activeConversation;
  if (notice.type !== "invite_declined" || conversation?._id !== notice.conversationId) return;
  notify({ severity: "info", message: `${firstNameIn(conversation, notice.user, user.user._id)} turned down the seat` });
};
