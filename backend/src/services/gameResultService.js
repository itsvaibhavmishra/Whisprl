import { GamePlayModel, GameResultModel } from "#src/models/index.js";
import { findMemberConversation } from "#src/services/conversationService.js";
import { isChosenBot } from "#src/services/games/seats.js";

// called with the session before and after a change, so only the change that ends a game is kept
export const recordResult = (before, after) => {
  // a game against a bot is practice, so it never reaches the leaderboard
  if (before?.status !== "playing" || !after?.result || before.seats.some(isChosenBot)) return null;
  return GameResultModel.create({
    conversation: after.conversation,
    game: after.game,
    players: before.seats.filter((seat) => seat.user).map((seat) => seat.user),
    winners: after.result.winners.map((winner) => winner.user),
  });
};

// counted once a game gets going, so a table opened and closed without playing is not a play
export const recordPlay = (before, after) => {
  if (before?.status === "playing" || after?.status !== "playing") return null;
  return GamePlayModel.create({ game: after.game, players: after.seats.filter((seat) => seat.user && !seat.official).map((seat) => seat.user) });
};

// players who have never had a game of this kind get going, so they are shown its rules as it starts
export const newcomersTo = async (session) => {
  const players = session.seats.filter((seat) => seat.user && !seat.official).map((seat) => String(seat.user));
  const veterans = (await GamePlayModel.distinct("players", { game: session.game, players: { $in: players } })).map(String);
  return players.filter((player) => !veterans.includes(player));
};

const isDraw = { $eq: [{ $size: "$winners" }, 0] };

export const leaderboardOf = async (userId, conversationId) => {
  const conversation = await findMemberConversation(conversationId, userId);
  const rows = await GameResultModel.aggregate([
    { $match: { conversation: conversation._id } },
    { $unwind: "$players" },
    {
      $group: {
        _id: { game: "$game", user: "$players" },
        played: { $sum: 1 },
        won: { $sum: { $cond: [{ $in: ["$players", "$winners"] }, 1, 0] } },
        drawn: { $sum: { $cond: [isDraw, 1, 0] } },
      },
    },
    { $sort: { won: -1, drawn: -1, played: 1 } },
  ]);

  return rows.map(({ _id, played, won, drawn }) => ({ game: _id.game, user: String(_id.user), played, won, drawn, lost: played - won - drawn }));
};
