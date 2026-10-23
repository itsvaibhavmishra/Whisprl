import { OAuth2Client } from "google-auth-library";
import createHttpError from "http-errors";

import { UserModel } from "#src/models/index.js";
import { normalizeEmail } from "#src/utils/accountRules.js";
import { randomCoverStyle } from "#src/utils/coverStyles.js";
import { fetchJson } from "#src/utils/fetchJson.js";
import { availableUsername } from "#src/services/usernameService.js";

const PROVIDER_NAMES = { google: "Google", github: "GitHub", linkedin: "LinkedIn" };

const notVerified = (provider) =>
  createHttpError.Unauthorized(`Verify your email with ${PROVIDER_NAMES[provider]} first, then try again`);

const googleClient = new OAuth2Client();

// the Android app signs in through Google itself and gets an ID token, where the website gets an access token
const isIdToken = (credential) => credential.split(".").length === 3;

// checks Google's signature, the expiry and that Whisprl is the audience, all without trusting the caller
const fetchGoogleIdTokenProfile = async (idToken) => {
  const ticket = await googleClient
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_AUTH_CLIENT_ID })
    .catch(() => null);
  const payload = ticket?.getPayload();
  if (!payload) throw createHttpError.Unauthorized("Unable to sign in using Google");
  if (!payload.email_verified) throw notVerified("google");

  return { email: payload.email, name: payload.name, picture: payload.picture };
};

// the token has to be one Google issued to Whisprl, or any site the person signed in to could reuse it here
const fetchGoogleAccessTokenProfile = async (accessToken) => {
  const tokenInfo = await fetchJson("https://oauth2.googleapis.com/tokeninfo", { query: { access_token: accessToken } });
  if (!process.env.GOOGLE_AUTH_CLIENT_ID || tokenInfo.aud !== process.env.GOOGLE_AUTH_CLIENT_ID) {
    throw createHttpError.Unauthorized("Unable to sign in using Google");
  }

  const data = await fetchJson("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!data.email_verified) throw notVerified("google");

  return { email: data.email, name: data.name, picture: data.picture };
};

const fetchGoogleProfile = (credential) =>
  isIdToken(credential) ? fetchGoogleIdTokenProfile(credential) : fetchGoogleAccessTokenProfile(credential);

const fetchGithubProfile = async (code) => {
  const token = await fetchJson("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: process.env.GITHUB_AUTH_CLIENT_ID, client_secret: process.env.GITHUB_AUTH_CLIENT_SECRET, code }),
  });
  if (!token.access_token) throw createHttpError.Unauthorized("Unable to sign in using GitHub");

  const headers = { Authorization: `Bearer ${token.access_token}`, "User-Agent": "Whisprl" };
  const [emails, profile] = await Promise.all([
    fetchJson("https://api.github.com/user/emails", { headers }),
    fetchJson("https://api.github.com/user", { headers }),
  ]);

  const primary = emails.find((entry) => entry.primary && entry.verified);
  if (!primary) throw notVerified("github");

  return { email: primary.email, name: profile.name || profile.login, picture: profile.avatar_url };
};

const fetchLinkedinProfile = async (code) => {
  const token = await fetchJson("https://linkedin.com/oauth/v2/accessToken", {
    query: {
      client_id: process.env.LINKEDIN_AUTH_CLIENT_ID,
      client_secret: process.env.LINKEDIN_AUTH_CLIENT_SECRET,
      redirect_uri: `${process.env.FRONT_URL}/auth/login`,
      grant_type: "authorization_code",
      code,
    },
    headers: { "Content-Type": "x-www-form-urlencoded" },
  });

  const data = await fetchJson("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}`, "User-Agent": "Whisprl" },
  });
  if (!data.email_verified) throw notVerified("linkedin");

  return { email: data.email, name: data.name, picture: data.picture };
};

const PROFILE_FETCHERS = { google: fetchGoogleProfile, github: fetchGithubProfile, linkedin: fetchLinkedinProfile };

const splitName = (name, email) => {
  const [firstName, ...rest] = (name?.trim() || email.split("@")[0]).split(/\s+/);
  return { firstName, lastName: rest.join(" ") || "onWhisprl" };
};

export const signInWithProvider = async (provider, credential) => {
  if (!credential) throw createHttpError.BadRequest(`Unable to sign in using ${PROVIDER_NAMES[provider]}`);

  const profile = await PROFILE_FETCHERS[provider](credential).catch((error) => {
    throw createHttpError.isHttpError(error)
      ? error
      : createHttpError.Unauthorized(`Unable to sign in using ${PROVIDER_NAMES[provider]}`);
  });

  const email = normalizeEmail(profile.email);
  const user =
    (await UserModel.findOne({ email })) ??
    new UserModel({ email, ...splitName(profile.name, email), avatar: profile.picture });

  // nobody proved they own an unverified account's password, so the provider's proof replaces it
  if (!user.verified) {
    user.verified = true;
    user.isNewAccount = true;
    user.password = undefined;
    user.verification = undefined;
  }
  user.socialsConnected.addToSet(provider);
  if (!user.avatar) user.avatar = profile.picture;
  user.username ??= await availableUsername(user.firstName, user.lastName);
  user.coverStyle ??= randomCoverStyle();
  await user.save();

  return user;
};
