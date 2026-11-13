import createHttpError from "http-errors";
import validator from "validator";

import { GameRequestModel } from "#src/models/index.js";
import { MAX_REQUEST_DETAILS, MAX_REQUEST_LINK, MAX_REQUEST_LINKS, MAX_REQUEST_NAME, REQUEST_KINDS } from "#src/models/gameRequestModel.js";
import { sendFromWhisprl } from "#src/services/whisprlMessageService.js";
import { reportError } from "#src/utils/errorReports.js";
import { nameKeyOf } from "#src/utils/textSearch.js";

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

export const spellingByPerson = (requests) => new Map(requests.map(({ user, name }) => [String(user), name]));

// staff mark requests added outside the app, so each is claimed before anyone is told, and two servers never tell twice
export const tellGameRequesters = async (io) => {
  const waiting = await GameRequestModel.find({ awaitingNotice: true }).select("_id").lean();
  const claimed = [];
  for (const { _id } of waiting) {
    const request = await GameRequestModel.findOneAndUpdate({ _id, awaitingNotice: true }, { $unset: { awaitingNotice: 1 } })
      .select("user name")
      .lean();
    if (request) claimed.push(request);
  }
  await Promise.all(
    [...spellingByPerson(claimed)].map(([user, name]) => sendFromWhisprl(io, user, { type: "gameAdded", name }).catch((error) => reportError(error, user)))
  );
};
