import axios from "axios";
import createHttpError from "http-errors";

export const requireRecaptcha = async (req, res, next) => {
  try {
    const { data } = await axios.post("https://www.google.com/recaptcha/api/siteverify", null, {
      params: { secret: process.env.GOOGLE_RECAPTCHA_SECRET, response: req.body.recaptchaToken },
    });

    if (!data.success) throw createHttpError.BadRequest("reCAPTCHA failed, please try again");
    next();
  } catch (error) {
    next(error);
  }
};
