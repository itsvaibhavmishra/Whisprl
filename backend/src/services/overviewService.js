import createHttpError from "http-errors";

import { ActivityModel, ConversationModel, GamePlayModel, MessageModel, UserModel } from "#src/models/index.js";
import { isUtcDay, shiftUtcDay, utcDayOf, utcDaysBetween } from "#src/utils/utcDays.js";

const MAX_DAYS = 366;
const PEOPLE_PER_PAGE = 20;
const PERSON_FIELDS = { firstName: 1, lastName: 1, username: 1, avatar: 1 };

const activeBetween = async (from, to) => (await ActivityModel.distinct("user", { day: { $gte: from, $lte: to } })).length;

const dayStart = (day) => new Date(`${day}T00:00:00Z`);

// a day noted before platforms were recorded was on the website, where nearly all use was then
const byPersonBetween = (from, to) => [
  { $match: { day: { $gte: from, $lte: to } } },
  { $unwind: { path: "$platforms", preserveNullAndEmptyArrays: true } },
  { $group: { _id: "$user", platforms: { $addToSet: { $ifNull: ["$platforms", "web"] } }, days: { $addToSet: "$day" }, lastDay: { $max: "$day" } } },
];

const platformsBetween = async (from, to) => {
  const people = await ActivityModel.aggregate([...byPersonBetween(from, to), { $project: { platforms: 1 } }]);
  const counts = { web: 0, android: 0, both: 0 };
  people.forEach(({ platforms }) => {
    counts[platforms.length > 1 ? "both" : platforms[0]] += 1;
  });
  return counts;
};

// each game's plays, and how many different people played it, bot games included
const gamesBetween = async (from, to) => {
  const rows = await GamePlayModel.aggregate([
    { $match: { createdAt: { $gte: dayStart(from), $lt: dayStart(shiftUtcDay(to, 1)) } } },
    { $group: { _id: "$game", plays: { $sum: 1 }, playerLists: { $push: "$players" } } },
    { $project: { plays: 1, players: { $size: { $reduce: { input: "$playerLists", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } } } } },
  ]);
  return rows.map(({ _id, plays, players }) => ({ game: _id, plays, players }));
};

const countsByDay = (rows) => new Map(rows.map(({ _id, count }) => [_id, count]));

const daysAskedFor = (from, to, today) => {
  if (!isUtcDay(from) || !isUtcDay(to) || from > to || to > today) throw createHttpError.BadRequest("Choose a range of days up to today");
  const days = utcDaysBetween(from, to);
  if (days.length > MAX_DAYS) throw createHttpError.BadRequest("Choose a range of a year or less");
  return days;
};

export const overviewOf = async (from, to) => {
  const today = utcDayOf(new Date());
  const days = daysAskedFor(from, to, today);

  const [users, conversations, messages, activeToday, activeWeek, activeMonth, activeInRange, signups, active, platforms, games] = await Promise.all([
    UserModel.countDocuments({ verified: true }),
    ConversationModel.countDocuments(),
    MessageModel.countDocuments({ event: { $exists: false } }),
    ActivityModel.countDocuments({ day: today }),
    activeBetween(shiftUtcDay(today, -6), today),
    activeBetween(shiftUtcDay(today, -29), today),
    activeBetween(from, to),
    UserModel.aggregate([
      { $match: { verified: true, createdAt: { $gte: dayStart(from), $lt: dayStart(shiftUtcDay(to, 1)) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    ActivityModel.aggregate([{ $match: { day: { $gte: from, $lte: to } } }, { $group: { _id: "$day", count: { $sum: 1 } } }]),
    platformsBetween(from, to),
    gamesBetween(from, to),
  ]);

  const signupsOn = countsByDay(signups);
  const activeOn = countsByDay(active);
  const daily = days.map((day) => ({ day, signups: signupsOn.get(day) ?? 0, active: activeOn.get(day) ?? 0 }));

  return {
    totals: { users, conversations, messages },
    active: { today: activeToday, week: activeWeek, month: activeMonth },
    range: { active: activeInRange, signups: daily.reduce((sum, entry) => sum + entry.signups, 0), platforms, games },
    daily,
  };
};

// the most recently active first, each with where they used Whisprl and on how many of the days
export const activePeopleOf = async (from, to, page) => {
  daysAskedFor(from, to, utcDayOf(new Date()));
  const skip = Math.max(0, Number.parseInt(page, 10) || 0) * PEOPLE_PER_PAGE;
  const rows = await ActivityModel.aggregate([
    ...byPersonBetween(from, to),
    { $sort: { lastDay: -1, _id: 1 } },
    // deleted accounts are dropped before the page is cut, or they leave it short
    { $lookup: { from: UserModel.collection.name, localField: "_id", foreignField: "_id", as: "person", pipeline: [{ $project: PERSON_FIELDS }] } },
    { $unwind: "$person" },
    { $skip: skip },
    { $limit: PEOPLE_PER_PAGE + 1 },
  ]);
  return {
    people: rows.slice(0, PEOPLE_PER_PAGE).map(({ person, platforms, days, lastDay }) => ({ ...person, platforms, activeDays: days.length, lastDay })),
    hasMore: rows.length > PEOPLE_PER_PAGE,
  };
};
