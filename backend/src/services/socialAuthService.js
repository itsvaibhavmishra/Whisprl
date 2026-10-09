import axios from "axios";
import createHttpError from "http-errors";
import qs from "querystring";

import { UserModel } from "#src/models/index.js";
import { normalizeEmail } from "#src/utils/accountRules.js";
import { randomCoverStyle } from "#src/utils/coverStyles.js";
import { availableUsername } from "#src/services/usernameService.js";

const PROVIDER_NAMES = { google: "Google", github: "GitHub", linkedin: "LinkedIn" };

const notVerified = (provider) =>
  createHttpError.Unauthorized(`Verify your email with ${PROVIDER_NAMES[provider]} first, then try again`);

// the token has to be one Google issued to Whisprl, or any site the person signed in to could reuse it here
const fetchGoogleProfile = async (accessToken) => {
  const { data: tokenInfo } = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
    params: { access_token: accessToken },
  });
  if (!process.env.GOOGLE_AUTH_CLIENT_ID || tokenInfo.aud !== process.env.GOOGLE_AUTH_CLIENT_ID) {
    throw createHttpError.Unauthorized("Unable to sign in using Google");
  }

  const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!data.email_verified) throw notVerified("google");

  return { email: data.email, name: data.name, picture: data.picture };
};

const fetchGithubProfile = async (code) => {
  const { data: token } = await axios.post(
    "https://github.com/login/oauth/access_token",
    { client_id: process.env.GITHUB_AUTH_CLIENT_ID, client_secret: process.env.GITHUB_AUTH_CLIENT_SECRET, code },
    { headers: { accept: "application/json" } }
  );
  if (!token.access_token) throw createHttpError.Unauthorized("Unable to sign in using GitHub");

  const headers = { Authorization: `Bearer ${token.access_token}`, "User-Agent": "Whisprl" };
  const [{ data: emails }, { data: profile }] = await Promise.all([
    axios.get("https://api.github.com/user/emails", { headers }),
    axios.get("https://api.github.com/user", { headers }),
  ]);

  const primary = emails.find((entry) => entry.primary && entry.verified);
  if (!primary) throw notVerified("github");

  return { email: primary.email, name: profile.name || profile.login, picture: profile.avatar_url };
};

const fetchLinkedinProfile = async (code) => {
  const tokenRequest = {
    client_id: process.env.LINKEDIN_AUTH_CLIENT_ID,
    client_secret: process.env.LINKEDIN_AUTH_CLIENT_SECRET,
    redirect_uri: `${process.env.FRONT_URL}/auth/login`,
    grant_type: "authorization_code",
    code,
  };
  const { data: token } = await axios(`https://linkedin.com/oauth/v2/accessToken?${qs.stringify(tokenRequest)}`, {
    headers: { "Content-Type": "x-www-form-urlencoded" },
  });

  const { data } = await axios.get("https://api.linkedin.com/v2/userinfo", {
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
