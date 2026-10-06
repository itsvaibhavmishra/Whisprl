import crypto from "crypto";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

import { SessionModel } from "#src/models/index.js";
import { sha256 } from "#src/utils/sha256.js";

const ACCESS_TOKEN_LIFETIME = "15m";
const SESSION_LIFETIME = 90 * 24 * 60 * 60 * 1000;
const ROTATION_GRACE = 30 * 1000;

const SESSION_COOKIE = "session";
const SESSION_COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: "none", path: "/api/auth" };

const SESSION_ENDED = "Your session ended, please log in again";

const newSessionToken = () => crypto.randomBytes(32).toString("base64url");

const nextExpiry = () => new Date(Date.now() + SESSION_LIFETIME);

const setSessionCookie = (res, token) =>
  res.cookie(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTIONS, maxAge: SESSION_LIFETIME, priority: "high" });

export const issueAccessToken = (user_id, session_id) =>
  jwt.sign({ sub: String(user_id), sid: String(session_id) }, process.env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_LIFETIME,
  });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw createHttpError.Unauthorized("Your session expired, please log in again");
  }
};

export const startSession = async (user, req, res) => {
  const token = newSessionToken();
  const session = await SessionModel.create({
    user: user._id,
    tokenHash: sha256(token),
    userAgent: req.get("user-agent")?.slice(0, 256),
    expiresAt: nextExpiry(),
  });

  setSessionCookie(res, token);
  return issueAccessToken(user._id, session._id);
};

const rotateSession = async (filter, changes, res) => {
  const nextToken = newSessionToken();
  const session = await SessionModel.findOneAndUpdate(
    { ...filter, expiresAt: { $gt: new Date() } },
    { ...changes, tokenHash: sha256(nextToken), rotatedAt: new Date(), expiresAt: nextExpiry() },
    { new: true }
  );
  if (session) setSessionCookie(res, nextToken);
  return session;
};

// a new cookie on every use, and the one before it is accepted only until the new one has been used
export const refreshSession = async (req, res) => {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) throw createHttpError.Unauthorized(SESSION_ENDED);

  const tokenHash = sha256(token);
  const current = await rotateSession({ tokenHash }, { previousTokenHash: tokenHash }, res);
  if (current) return current;

  const previous = await SessionModel.findOne({ previousTokenHash: tokenHash, expiresAt: { $gt: new Date() } });
  if (!previous) throw createHttpError.Unauthorized(SESSION_ENDED);

  // moments after a rotation this is another tab, and the browser already holds the new cookie
  if (Date.now() - previous.rotatedAt.getTime() < ROTATION_GRACE) return previous;

  // later, the reply carrying the new cookie never arrived, so this browser gets another
  const reissued = await rotateSession({ _id: previous._id, previousTokenHash: tokenHash }, {}, res);
  if (!reissued) throw createHttpError.Unauthorized(SESSION_ENDED);
  return reissued;
};

export const endSession = async (req, res) => {
  const token = req.cookies[SESSION_COOKIE];
  const session = token && (await SessionModel.findOneAndDelete({ tokenHash: sha256(token) }));
  res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);
  return session;
};

export const endOtherSessions = (user_id, keep_session_id) =>
  SessionModel.deleteMany({ user: user_id, _id: { $ne: keep_session_id } });

export const endAllSessions = (user_id) => SessionModel.deleteMany({ user: user_id });

const disconnectSockets = async (io, user_id, shouldClose) => {
  const sockets = await io.in(String(user_id)).fetchSockets();
  sockets.filter((socket) => shouldClose(socket.data.sessionId)).forEach((socket) => socket.disconnect(true));
};

// a socket is authenticated once, when it connects, so ending a session has to close its sockets too
export const signOutOtherDevices = (io, user_id, keep_session_id) =>
  disconnectSockets(io, user_id, (session_id) => session_id !== String(keep_session_id));

export const signOutSession = (io, session) =>
  disconnectSockets(io, session.user, (session_id) => session_id === String(session._id));

export const signOutEverywhere = (io, user_id) => io.in(String(user_id)).disconnectSockets(true);
