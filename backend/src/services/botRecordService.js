import { BotRecordModel } from "#src/models/index.js";
import { recentAfter, skillAfter, skillForGame } from "#src/services/games/botLevels.js";
import { isBotOpponent } from "#src/services/games/seats.js";

const playersOf = (session) => session.seats.filter((seat) => seat.user && !seat.official).map((seat) => String(seat.user));

const recordsOf = async (session) => {
  const players = playersOf(session);
  const records = await BotRecordModel.find({ user: { $in: players }, game: session.game }).lean();
  return players.map((player) => ({ player, record: records.find((record) => String(record.user) === player) ?? { played: 0, recent: [] } }));
};

// at a table of several, the bot plays to whoever has the fewest games against it
export const botSkillFor = async (session) => {
  if (!session.seats.some(isBotOpponent)) return undefined;
  const fewest = (await recordsOf(session)).reduce((least, each) => (each.record.played < least.record.played ? each : least));
  return skillForGame(fewest.record);
};

const resultFor = (player, winners) => {
  if (!winners.length) return "drawn";
  return winners.some((winner) => winner.user === player) ? "won" : "lost";
};

// called with the session before and after a change, so only the change that ends a game against a bot or Whisprl is kept
export const recordBotGame = async (before, after) => {
  if (before?.status !== "playing" || !after?.result || !before.seats.some(isBotOpponent)) return null;
  const updates = (await recordsOf(before)).map(({ player, record }) => {
    const result = resultFor(player, after.result.winners);
    return {
      updateOne: {
        filter: { user: player, game: before.game },
        update: {
          $set: { skill: skillAfter(record, result), recent: recentAfter(record, result) },
          $inc: { played: 1 },
        },
        upsert: true,
      },
    };
  });
  return BotRecordModel.bulkWrite(updates);
};
