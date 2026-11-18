import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";

import { UserModel } from "#src/models/index.js";
import { NAME_LIMIT, normalizeEmail } from "#src/utils/accountRules.js";
import { randomCoverStyle } from "#src/utils/coverStyles.js";
import { fetchJson } from "#src/utils/fetchJson.js";
import { markReached, startJourney } from "#src/services/journeyService.js";
import { availableUsername } from "#src/services/usernameService.js";
import { befriendWhisprl } from "#src/services/whisprlService.js";
import { welcomeToWhisprl } from "#src/services/whisprlMessageService.js";
import { reportError } from "#src/utils/errorReports.js";

const notVerified = () => createHttpError.Unauthorized("Verify your email with Google first, then try again");

const googleClient = new OAuth2Client();

// the Android app signs in through Google itself and gets an ID token, where the website gets an access token
const isIdToken = (credential) => credential.split(".").length === 3;

// checks Google's signature, the expiry and that Whisprl is the audience, all without trusting the caller
const fetchGoogleIdTokenProfile = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_AUTH_CLIENT_ID }).catch(() => null);
  const payload = ticket?.getPayload();
  if (!payload) throw createHttpError.Unauthorized("Unable to sign in using Google");
  if (!payload.email_verified) throw notVerified();

  return { email: payload.email, name: payload.name, picture: payload.picture };
};

// the token has to be one Google issued to Whisprl, or any site the person signed in to could reuse it here
const fetchGoogleAccessTokenProfile = async (accessToken) => {
  const tokenInfo = await fetchJson("https://oauth2.googleapis.com/tokeninfo", { query: { access_token: accessToken } });
  if (!process.env.GOOGLE_AUTH_CLIENT_ID || tokenInfo.aud !== process.env.GOOGLE_AUTH_CLIENT_ID) {
    throw createHttpError.Unauthorized("Unable to sign in using Google");
  }

  const data = await fetchJson("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!data.email_verified) throw notVerified();

  return { email: data.email, name: data.name, picture: data.picture };
};

const fetchGoogleProfile = (credential) => (isIdToken(credential) ? fetchGoogleIdTokenProfile(credential) : fetchGoogleAccessTokenProfile(credential));

const nameOf = (name, email) => (name?.trim() || email.split("@")[0]).replace(/\s+/g, " ").slice(0, NAME_LIMIT);

export const openAccount = async ({ email: typedEmail, name, picture }, via) => {
  const email = normalizeEmail(typedEmail);
  const user = (await UserModel.findOne({ email })) ?? new UserModel({ email, name: nameOf(name, email), avatar: picture });

  // an unverified account is an old email sign up still waiting on its code, so it goes to whoever proves the email
  if (!user.verified) {
    user.verified = true;
    user.isNewAccount = true;
    user.password = undefined;
    user.verification = undefined;
    befriendWhisprl(user);
    if (via) startJourney(user, via);
    markReached(user, "verified");
  }
  if (via) user.socialsConnected.addToSet(via);
  if (!user.avatar) user.avatar = picture;
  user.username ??= await availableUsername(user.name);
  user.coverStyle ??= randomCoverStyle();
  await user.save();
  await welcomeToWhisprl(user._id).catch((error) => reportError(error, user._id));

  return user;
};

export const signInWithGoogle = async (credential) => {
  if (!credential) throw createHttpError.BadRequest("Unable to sign in using Google");

  const profile = await fetchGoogleProfile(credential).catch((error) => {
    throw createHttpError.isHttpError(error) ? error : createHttpError.Unauthorized("Unable to sign in using Google");
  });
  return openAccount(profile, "google");
};
