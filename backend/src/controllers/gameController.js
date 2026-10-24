import { requestGame } from "#src/services/gameRequestService.js";
import { leaderboardOf } from "#src/services/gameResultService.js";
import { actInGame, lookAtGame, reactInGame, stopWatching, watchGame } from "#src/services/gameService.js";

const answered = async (acknowledge, work) => {
  const reply = typeof acknowledge === "function" ? acknowledge : () => {};
  try {
    await work();
    reply({ status: "success" });
  } catch (error) {
    reply({ status: "error", message: error.expose ? error.message : "Could not reach Whisprl", details: error.details });
  }
};

export const socketWatchGame = (io, socket, conversationId, acknowledge) => answered(acknowledge, () => watchGame(io, socket, conversationId));

export const socketUnwatchGame = (io, socket, acknowledge) => answered(acknowledge, () => stopWatching(io, socket));

export const socketLookAtGame = (io, socket, isLooking, acknowledge) => answered(acknowledge, () => lookAtGame(io, socket, isLooking));

export const socketReactInGame = (socket, emoji, acknowledge) => answered(acknowledge, () => reactInGame(socket, emoji));

export const socketActInGame = (io, socket, payload, acknowledge) => answered(acknowledge, () => actInGame(io, socket.data.userId, payload ?? {}));

export const leaveGameOnDisconnect = (io, socket) => stopWatching(io, socket).catch((error) => console.error(`[games] ${error.message}`));

export const getLeaderboard = async (req, res) => {
  res.status(200).json({ status: "success", leaderboard: await leaderboardOf(req.user._id, req.params.conversation_id) });
};

export const sendGameRequest = async (req, res) => {
  await requestGame(req.user._id, req.body);
  res.status(201).json({ status: "success" });
};
