import createHttpError from "http-errors";

import { ActivityModel, ConversationModel, GamePlayModel, MessageModel, UserModel } from "#src/models/index.js";
import { JOURNEY_STAGES, reachedFieldOf } from "#src/services/journeyService.js";
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

const countsByKey = (rows) => new Map(rows.map(({ _id, count }) => [_id, count]));

const pageStart = (page) => Math.max(0, Number.parseInt(page, 10) || 0) * PEOPLE_PER_PAGE;

const startedBetween = (from, to) => ({ "journey.startedAt": { $gte: dayStart(from), $lt: dayStart(shiftUtcDay(to, 1)) } });

// the first stage not reached yet, so each account is counted once, where it stopped
const stoppedAt = {
  $switch: {
    branches: JOURNEY_STAGES.map((stage) => ({ case: { $not: [{ $ifNull: ["$" + reachedFieldOf(stage), false] }] }, then: stage })),
    default: "finished",
  },
};

const journeyBetween = async (from, to) => {
  const stoppedOn = countsByKey(await UserModel.aggregate([{ $match: startedBetween(from, to) }, { $group: { _id: stoppedAt, count: { $sum: 1 } } }]));
  const started = [...stoppedOn.values()].reduce((sum, count) => sum + count, 0);
  let reached = started;
  const stages = JOURNEY_STAGES.map((stage) => {
    const stopped = stoppedOn.get(stage) ?? 0;
    reached -= stopped;
    return { stage, reached, stopped };
  });
  return { started, stages };
};

const daysAskedFor = (from, to, today) => {
  if (!isUtcDay(from) || !isUtcDay(to) || from > to || to > today) throw createHttpError.BadRequest("Choose a range of days up to today");
  const days = utcDaysBetween(from, to);
  if (days.length > MAX_DAYS) throw createHttpError.BadRequest("Choose a range of a year or less");
  return days;
};

export const overviewOf = async (from, to) => {
  const today = utcDayOf(new Date());
  const days = daysAskedFor(from, to, today);

  const [users, conversations, messages, activeToday, activeWeek, activeMonth, activeInRange, signups, active, platforms, games, journey] = await Promise.all([
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
    journeyBetween(from, to),
  ]);

  const signupsOn = countsByKey(signups);
  const activeOn = countsByKey(active);
  const daily = days.map((day) => ({ day, signups: signupsOn.get(day) ?? 0, active: activeOn.get(day) ?? 0 }));

  return {
    totals: { users, conversations, messages },
    active: { today: activeToday, week: activeWeek, month: activeMonth },
    range: { active: activeInRange, signups: daily.reduce((sum, entry) => sum + entry.signups, 0), platforms, games, journey },
    daily,
  };
};

// the most recently active first, each with where they used Whisprl and on how many of the days
export const activePeopleOf = async (from, to, page) => {
  daysAskedFor(from, to, utcDayOf(new Date()));
  const skip = pageStart(page);
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

// everyone who reached every stage before this one and stopped here, newest first
export const stoppedPeopleOf = async (stage, from, to, page) => {
  const position = JOURNEY_STAGES.indexOf(stage);
  if (position === -1) throw createHttpError.BadRequest("Choose a stage of signing up");
  daysAskedFor(from, to, utcDayOf(new Date()));
  const reachedBefore = Object.fromEntries(JOURNEY_STAGES.slice(0, position).map((earlier) => [reachedFieldOf(earlier), { $exists: true }]));
  const rows = await UserModel.find({ ...startedBetween(from, to), ...reachedBefore, [reachedFieldOf(stage)]: { $exists: false } })
    .sort({ "journey.startedAt": -1, _id: 1 })
    .skip(pageStart(page))
    .limit(PEOPLE_PER_PAGE + 1)
    .select({ ...PERSON_FIELDS, "journey.startedAt": 1, "journey.via": 1 })
    .lean();
  return {
    people: rows.slice(0, PEOPLE_PER_PAGE).map(({ journey, ...person }) => ({ ...person, startedAt: journey.startedAt, via: journey.via })),
    hasMore: rows.length > PEOPLE_PER_PAGE,
  };
};
