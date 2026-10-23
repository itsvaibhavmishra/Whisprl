import nodemailer from "nodemailer";

const config = {
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
};

const transporter = nodemailer.createTransport(config);

export const sendMail = (to, subject, { html, text }, headers) =>
  transporter.sendMail({ from: `Whisprl <${process.env.MAIL_USER}>`, to, subject, html, text, ...(headers && { headers }) });

export const formatRemainingTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return minutes > 0 ? `${minutes}min ${seconds}s` : `${seconds}s`;
};
