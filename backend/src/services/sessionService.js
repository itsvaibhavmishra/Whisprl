import crypto from "crypto";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { SessionModel } from "#src/models/index.js";

const ACCESS_TOKEN_SECONDS = 15 * 60;
const CHALLENGE_SECONDS = 2 * 60;
const SESSION_LIFETIME = 90 * 24 * 60 * 60 * 1000;
const MAX_SESSION_KEY_LENGTH = 256;

const ACCESS_AUDIENCE = "access";
const CHALLENGE_AUDIENCE = "session-challenge";

// the code tells the browser what to do: an invalid token is renewed, an ended session means logging in again
const tokenInvalid = () => createHttpError(401, "Your sign-in needs renewing, please try again", { code: "token_invalid" });

export const sessionEnded = () => createHttpError(401, "Your session ended, please log in again", { code: "session_ended" });

const nextExpiry = () => new Date(Date.now() + SESSION_LIFETIME);

const signToken = (claims, audience, expiresIn) =>
  jwt.sign(claims, process.env.JWT_ACCESS_SECRET, { algorithm: "HS256", audience, expiresIn });

const readToken = (token, audience) => jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ["HS256"], audience });

export const issueAccessToken = (user_id, session_id) => ({
  accessToken: signToken({ sub: String(user_id), sid: String(session_id) }, ACCESS_AUDIENCE, ACCESS_TOKEN_SECONDS),
  expiresIn: ACCESS_TOKEN_SECONDS,
});

export const verifyAccessToken = (token) => {
  try {
    return readToken(token, ACCESS_AUDIENCE);
  } catch {
    throw tokenInvalid();
  }
};

const publicKeyFrom = (encoded) => {
  try {
    return crypto.createPublicKey({ key: Buffer.from(encoded, "base64"), format: "der", type: "spki" });
  } catch {
    return null;
  }
};

export const assertSessionKey = (encoded) => {
  const key = typeof encoded === "string" && encoded.length <= MAX_SESSION_KEY_LENGTH ? publicKeyFrom(encoded) : null;
  if (key?.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
    throw createHttpError.BadRequest("Reload Whisprl to get the latest version, then log in again");
  }
};

export const startSession = async (user, sessionKey, req) => {
  const session = await SessionModel.create({
    user: user._id,
    publicKey: sessionKey,
    userAgent: req.get("user-agent")?.slice(0, 256),
    expiresAt: nextExpiry(),
  });
  return { sessionId: session._id, ...issueAccessToken(user._id, session._id) };
};

export const issueChallenge = () => signToken({}, CHALLENGE_AUDIENCE, CHALLENGE_SECONDS);

// Web Crypto writes an ECDSA signature as r and s side by side, which Node calls IEEE P1363
const isSignedBy = (publicKey, challenge, signature) => {
  try {
    const verifier = { key: publicKeyFrom(publicKey), dsaEncoding: "ieee-p1363" };
    return crypto.verify("sha256", Buffer.from(challenge), verifier, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
};

// nothing is replaced, so tabs renewing together, retries and replies that never arrive all leave the session as it was
export const renewSession = async ({ sessionId, challenge, signature }) => {
  try {
    readToken(challenge, CHALLENGE_AUDIENCE);
  } catch {
    throw createHttpError.BadRequest("That took too long, please try again");
  }

  const session = mongoose.isValidObjectId(sessionId)
    ? await SessionModel.findOne({ _id: sessionId, expiresAt: { $gt: new Date() } })
    : null;
  if (!session || !isSignedBy(session.publicKey, challenge, signature)) throw sessionEnded();

  session.expiresAt = nextExpiry();
  await session.save();
  return session;
};

export const isSessionActive = (session_id) => SessionModel.exists({ _id: session_id, expiresAt: { $gt: new Date() } });

export const endSession = (session_id) => SessionModel.findByIdAndDelete(session_id);

export const endOtherSessions = (user_id, keep_session_id) =>
  SessionModel.deleteMany({ user: user_id, _id: { $ne: keep_session_id } });

export const endAllSessions = (user_id) => SessionModel.deleteMany({ user: user_id });

// sessions from before keys can never renew, and the unique index they relied on would refuse new ones
export const dropKeylessSessions = async () => {
  const { deletedCount } = await SessionModel.deleteMany({ publicKey: { $exists: false } });
  await SessionModel.syncIndexes();
  return deletedCount;
};

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
