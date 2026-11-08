import { BotRecordModel } from "#src/models/index.js";
import { levelFor } from "#src/services/games/botLevels.js";
import { isChosenBot } from "#src/services/games/seats.js";

const playersOf = (session) => session.seats.filter((seat) => seat.user).map((seat) => String(seat.user));

// at a table of several, the bot plays to whoever has the fewest games against it
export const botLevelFor = async (session) => {
  if (!session.seats.some(isChosenBot)) return undefined;
  const players = playersOf(session);
  const records = await BotRecordModel.find({ user: { $in: players }, game: session.game }).lean();
  const recordOf = (player) => records.find((record) => String(record.user) === player) ?? { played: 0, recent: [] };
  return levelFor(players.map(recordOf).reduce((fewest, record) => (record.played < fewest.played ? record : fewest)));
};

const resultFor = (player, winners) => {
  if (!winners.length) return "drawn";
  return winners.some((winner) => winner.user === player) ? "won" : "lost";
};

// called with the session before and after a change, so only the change that ends a game against a chosen bot is kept
export const recordBotGame = (before, after) => {
  if (before?.status !== "playing" || !after?.result || !before.seats.some(isChosenBot)) return null;
  return BotRecordModel.bulkWrite(
    playersOf(before).map((player) => ({
      updateOne: {
        filter: { user: player, game: before.game },
        update: { $inc: { played: 1 }, $push: { recent: { $each: [resultFor(player, after.result.winners)], $slice: -2 } } },
        upsert: true,
      },
    }))
  );
};
