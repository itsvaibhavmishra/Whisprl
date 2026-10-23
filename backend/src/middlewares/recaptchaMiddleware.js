import createHttpError from "http-errors";

import { fetchJson } from "#src/utils/fetchJson.js";

export const requireRecaptcha = async (req, res, next) => {
  const data = await fetchJson("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    query: { secret: process.env.GOOGLE_RECAPTCHA_SECRET, response: req.body.recaptchaToken },
  });

  if (!data.success) throw createHttpError.BadRequest("reCAPTCHA failed, please try again");
  next();
};
