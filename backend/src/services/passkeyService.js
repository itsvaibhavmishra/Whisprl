import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import createHttpError from "http-errors";
import mongoose from "mongoose";

import { PasskeyChallengeModel, PasskeyModel } from "../models/index.js";
import { findSessionUser } from "./authService.js";

const CHALLENGE_LIFETIME = 5 * 60 * 1000;

// a passkey belongs to the site's domain, so it is the frontend's address that both sides check
const relyingParty = () => {
  const { origin, hostname } = new URL(process.env.FRONT_URL);
  return { origin, rpID: hostname };
};

const rememberChallenge = (challenge, purpose, user_id) =>
  PasskeyChallengeModel.create({ challenge, purpose, user: user_id, expiresAt: Date.now() + CHALLENGE_LIFETIME });

// each challenge is used once, so a passkey response copied on its way can never be played back
const consumeChallenge = (purpose, user_id) => async (challenge) =>
  Boolean(
    await PasskeyChallengeModel.findOneAndDelete({
      challenge,
      purpose,
      ...(user_id && { user: user_id }),
      expiresAt: { $gt: new Date() },
    })
  );

const summaryOf = ({ _id, credentialId, backedUp, createdAt, lastUsedAt, keyBackup }) => ({
  _id,
  credentialId,
  backedUp,
  createdAt,
  lastUsedAt,
  unlocksMessages: Boolean(keyBackup),
});

export const listPasskeys = async (user_id) =>
  (await PasskeyModel.find({ user: user_id }).select("+keyBackup").sort({ createdAt: 1 })).map(summaryOf);

export const passkeyRegistrationOptions = async (user) => {
  const existing = await PasskeyModel.find({ user: user._id }).select("credentialId transports");
  const options = await generateRegistrationOptions({
    rpName: "Whisprl",
    rpID: relyingParty().rpID,
    userName: user.email,
    userDisplayName: `${user.firstName} ${user.lastName}`,
    userID: new TextEncoder().encode(String(user._id)),
    attestationType: "none",
    excludeCredentials: existing.map(({ credentialId, transports }) => ({ id: credentialId, transports })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });

  await rememberChallenge(options.challenge, "register", user._id);
  return options;
};

export const registerPasskey = async (user, response) => {
  const { origin, rpID } = relyingParty();
  const { verified, registrationInfo } = await verifyRegistrationResponse({
    response,
    expectedChallenge: consumeChallenge("register", user._id),
    expectedOrigin: origin,
    expectedRPID: rpID,
  }).catch(() => ({ verified: false }));

  if (!verified) throw createHttpError.BadRequest("That passkey could not be added, please try again");

  const { credential, credentialBackedUp } = registrationInfo;
  await PasskeyModel.create({
    user: user._id,
    credentialId: credential.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports,
    backedUp: credentialBackedUp,
  });
};

export const removePasskey = async (user_id, passkey_id) => {
  const { deletedCount } = mongoose.isValidObjectId(passkey_id)
    ? await PasskeyModel.deleteOne({ _id: passkey_id, user: user_id })
    : { deletedCount: 0 };
  if (!deletedCount) throw createHttpError.NotFound("Passkey not found");
};

export const passkeyLoginOptions = async () => {
  // a passkey stands in for a password, so the device has to confirm it is its owner, not just that someone tapped it
  const options = await generateAuthenticationOptions({ rpID: relyingParty().rpID, userVerification: "required" });
  await rememberChallenge(options.challenge, "login");
  return options;
};

// the passkey's own copy of the account key comes back with the session, so a browser that can unlock does so at once
export const loginWithPasskey = async (response) => {
  const credentialId = typeof response?.id === "string" ? response.id : null;
  const passkey = credentialId && (await PasskeyModel.findOne({ credentialId }).select("+keyBackup"));
  if (!passkey) throw createHttpError.Unauthorized("That passkey is not registered with Whisprl");

  const { origin, rpID } = relyingParty();
  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response,
    expectedChallenge: consumeChallenge("login"),
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey: isoBase64URL.toBuffer(passkey.publicKey),
      counter: passkey.counter,
      transports: passkey.transports,
    },
  }).catch(() => ({ verified: false }));

  if (!verified) throw createHttpError.Unauthorized("That passkey could not be checked, please try again");

  passkey.counter = authenticationInfo.newCounter;
  passkey.lastUsedAt = new Date();
  await passkey.save();

  return { user: await findSessionUser(passkey.user), keyBackup: passkey.keyBackup ?? null };
};
