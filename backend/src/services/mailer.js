import nodemailer from "nodemailer";

const config = {
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // gmail email
    pass: process.env.MAIL_PASS, // gmail password
  },
};

export const transporter = nodemailer.createTransport(config);

// Check time remaining before sending main
export const formatRemainingTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;
};
