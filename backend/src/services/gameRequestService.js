import createHttpError from "http-errors";
import validator from "validator";

import { GameRequestModel } from "#src/models/index.js";
import { MAX_REQUEST_DETAILS, MAX_REQUEST_LINK, MAX_REQUEST_LINKS, MAX_REQUEST_NAME, REQUEST_KINDS, REQUEST_STATUSES } from "#src/models/gameRequestModel.js";
import { nameKeyOf, searchScore } from "#src/utils/textSearch.js";

const PAGE_SIZE = 20;
const PERSON_FIELDS = "firstName lastName username avatar";
const OUTCOMES = ["added", "dismissed"];
const NAME_START_BONUS = 2;

// a link pasted without its scheme still counts, and anything that is not a web address is refused
const linkFrom = (raw) => {
  const link = String(raw ?? "").trim();
  if (!link) return null;
  const address = /^https?:\/\//i.test(link) ? link : `https://${link}`;
  if (address.length > MAX_REQUEST_LINK || !validator.isURL(address, { protocols: ["http", "https"], require_protocol: true })) {
    throw createHttpError.BadRequest(`"${link}" is not a web address`);
  }
  return address;
};

export const requestGame = async (user_id, { kind, name, links = [], details = "" }) => {
  if (!REQUEST_KINDS.includes(kind)) throw createHttpError.BadRequest("Choose what kind of game it is");
  const given = String(name ?? "").trim();
  const nameKey = nameKeyOf(given);
  if (!nameKey) throw createHttpError.BadRequest("Give the game a name");
  if (given.length > MAX_REQUEST_NAME) throw createHttpError.BadRequest(`Keep the name under ${MAX_REQUEST_NAME} characters`);
  if (!Array.isArray(links) || links.length > MAX_REQUEST_LINKS) throw createHttpError.BadRequest(`Add up to ${MAX_REQUEST_LINKS} links`);
  const note = String(details ?? "").trim();
  if (note.length > MAX_REQUEST_DETAILS) throw createHttpError.BadRequest(`Keep the details under ${MAX_REQUEST_DETAILS} characters`);

  if (await GameRequestModel.exists({ user: user_id, nameKey, status: "open" })) {
    throw createHttpError.Conflict(`You have already asked for ${given}`);
  }
  await GameRequestModel.create({ user: user_id, kind, name: given, nameKey, links: links.map(linkFrom).filter(Boolean), details: note });
};

const mostCommon = (values) => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
};

const asGroup = (requests) => {
  const newestFirst = [...requests].sort((first, second) => second.createdAt - first.createdAt);
  const [newest] = newestFirst;
  return {
    key: newest.nameKey,
    name: mostCommon(newestFirst.map((request) => request.name)),
    kind: mostCommon(newestFirst.map((request) => request.kind)),
    count: requests.length,
    latestAt: newest.createdAt,
    closedAt: newest.closedAt,
    closedBy: newest.closedBy,
    requests: newestFirst.map(({ _id, kind, name, links, details, createdAt, user }) => ({ _id, kind, name, links, details, createdAt, user })),
  };
};

const byDemand = (first, second) => second.count - first.count || second.latestAt - first.latestAt;

// names count most, then what people wrote and linked, then who asked, and a name starting with the query ranks first
const relevanceOf = (group, query) => {
  const score = searchScore(query, [
    { text: group.requests.map((request) => request.name).join(" "), weight: 3 },
    { text: group.requests.flatMap((request) => [request.details, ...request.links]).join(" "), weight: 1 },
    { text: group.requests.map(({ user }) => (user ? `${user.firstName} ${user.lastName} ${user.username ?? ""}` : "")).join(" "), weight: 1 },
  ]);
  return score && group.key.startsWith(nameKeyOf(query)) ? score + NAME_START_BONUS : score;
};

// requests are few enough to group and score in memory, which is what lets a search forgive typos
export const listGameRequests = async ({ status = "open", kind = "all", search = "", page = 0 }) => {
  if (!REQUEST_STATUSES.includes(status)) throw createHttpError.BadRequest("Choose a status that exists");
  if (kind !== "all" && !REQUEST_KINDS.includes(kind)) throw createHttpError.BadRequest("Choose a kind that exists");

  const requests = await GameRequestModel.find({ status }).populate("user", PERSON_FIELDS).populate("closedBy", PERSON_FIELDS).lean();
  const byKey = new Map();
  for (const request of requests) {
    if (!byKey.has(request.nameKey)) byKey.set(request.nameKey, []);
    byKey.get(request.nameKey).push(request);
  }

  // the rank is by demand across everything open, so it means the same thing while searching or filtering
  const ranked = [...byKey.values()]
    .map(asGroup)
    .sort(byDemand)
    .map((group, position) => ({ ...group, rank: position + 1 }));
  const ofKind = kind === "all" ? ranked : ranked.filter((group) => group.requests.some((request) => request.kind === kind));
  const query = typeof search === "string" ? search.trim() : "";
  const shown = query
    ? ofKind
        .map((group) => ({ group, relevance: relevanceOf(group, query) }))
        .filter(({ relevance }) => relevance > 0)
        .sort((first, second) => second.relevance - first.relevance || byDemand(first.group, second.group))
        .map(({ group }) => group)
    : ofKind;

  const start = Math.max(0, Number(page) || 0) * PAGE_SIZE;
  return {
    groups: shown.slice(start, start + PAGE_SIZE),
    total: shown.length,
    hasMore: start + PAGE_SIZE < shown.length,
    mostAsked: ranked[0]?.count ?? 0,
  };
};

export const closeGameRequests = async (actor, nameKey, outcome) => {
  if (!OUTCOMES.includes(outcome)) throw createHttpError.BadRequest("Mark it added or dismissed");
  const { modifiedCount } = await GameRequestModel.updateMany(
    { nameKey: String(nameKey), status: "open" },
    { status: outcome, closedBy: actor._id, closedAt: new Date() }
  );
  if (!modifiedCount) throw createHttpError.BadRequest("Those requests have already been dealt with");
};
