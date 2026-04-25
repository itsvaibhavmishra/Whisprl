import createHttpError from "http-errors";
import axios from "axios";
import qs from "querystring";

import { handleSocialUser } from "../services/socialAuthService.js";

// -------------------------- Google Auth --------------------------
export const googleAuth = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      throw createHttpError.BadRequest("Unable to sign in using Google");
    }

    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${code}`,
        },
      }
    );

    const { email_verified, email, name, picture } = data;

    if (!email_verified) {
      throw createHttpError.Unauthorized("Google Email is Not Verified");
    }

    const userData = await handleSocialUser(
      email,
      name,
      picture,
      "google",
      res
    );

    return res.status(200).json({
      status: "success",
      message: "Logged In",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Github Auth --------------------------
export const githubAuth = async (req, res, next) => {
  try {
    const { code } = req.body;

    const sendingBody = {
      client_id: process.env.GITHUB_AUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_AUTH_CLIENT_SECRET,
      code,
    };

    const opts = { headers: { accept: "application/json" } };

    const githubToken = await axios.post(
      "https://github.com/login/oauth/access_token",
      sendingBody,
      opts
    );

    const userEmail = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${githubToken.data.access_token}`,
        "User-Agent": "Whisprl",
      },
    });

    const [{ email }] = userEmail.data.filter((e) => e.primary === true);

    const { data } = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken.data.access_token}`,
        "User-Agent": "Whisprl",
      },
    });

    const { name, avatar_url } = data;

    const userData = await handleSocialUser(
      email,
      name,
      avatar_url,
      "github",
      res
    );

    return res.status(200).json({
      status: "success",
      message: "Logged In",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Linkedin Auth --------------------------
export const linkedinAuth = async (req, res, next) => {
  try {
    const { code } = req.body;

    const sendingBody = {
      client_id: process.env.LINKEDIN_AUTH_CLIENT_ID,
      client_secret: process.env.LINKEDIN_AUTH_CLIENT_SECRET,
      redirect_uri: `${process.env.FRONT_URL}/auth/login`,
      grant_type: "authorization_code",
      code,
    };

    const opts = { headers: { "Content-Type": "x-www-form-urlencoded" } };

    const linkedinToken = await axios(
      `https://linkedin.com/oauth/v2/accessToken?${qs.stringify(sendingBody)}`,
      opts
    );

    const { data } = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${linkedinToken.data.access_token}`,
        "User-Agent": "Whisprl",
      },
    });

    const { name, email, picture } = data;

    const userData = await handleSocialUser(
      email,
      name,
      picture,
      "linkedin",
      res
    );

    return res.status(200).json({
      status: "success",
      message: "Logged In",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};
