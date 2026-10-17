import { leaderboardOf } from "#src/services/gameResultService.js";
import { actInGame, stopWatching, watchGame } from "#src/services/gameService.js";

const answered = async (acknowledge, work) => {
  const reply = typeof acknowledge === "function" ? acknowledge : () => {};
  try {
    await work();
    reply({ status: "success" });
  } catch (error) {
    reply({ status: "error", message: error.expose ? error.message : "Could not reach Whisprl", details: error.details });
  }
};

export const socketWatchGame = (io, socket, conversationId, acknowledge) =>
  answered(acknowledge, () => watchGame(io, socket, conversationId));

export const socketUnwatchGame = (socket, acknowledge) => answered(acknowledge, () => stopWatching(socket));

export const socketActInGame = (io, socket, payload, acknowledge) =>
  answered(acknowledge, () => actInGame(io, socket.data.userId, payload ?? {}));

export const leaveGameOnDisconnect = (socket) =>
  stopWatching(socket).catch((error) => console.error(`[games] ${error.message}`));

export const getLeaderboard = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", leaderboard: await leaderboardOf(req.user._id, req.params.conversation_id) });
  } catch (error) {
    next(error);
  }
};
