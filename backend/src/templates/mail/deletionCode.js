import { mail, panel, paragraph } from "#src/templates/mail/layout.js";
import { codeBlock } from "#src/templates/mail/otp.js";

export default (name, otp) =>
  mail({
    title: "Your code to delete your account",
    preheader: `${otp} is your code to delete your Whisprl account. It expires in 10 minutes.`,
    body: `
${paragraph(`Hey ${name},`)}
${paragraph("Here is the code to delete your Whisprl account. Enter it in Whisprl to confirm.")}
${codeBlock(otp)}
${panel("Good to know", "The code works for 10 minutes, and only once. Your account is hidden as soon as you confirm and deleted 14 days later. Logging in before then brings it back.")}
${paragraph('<span style="color:#5F6E86;" class="muted">If you did not ask to delete your account, ignore this email and change your password. Nothing has changed on your account.</span>')}`,
    text: [
      `Hey ${name},`,
      "",
      "Here is the code to delete your Whisprl account. Enter it in Whisprl to confirm.",
      "",
      `    ${otp}`,
      "",
      "The code works for 10 minutes, and only once. Your account is hidden as soon as you confirm and deleted 14 days later. Logging in before then brings it back.",
      "",
      "If you did not ask to delete your account, ignore this email and change your password. Nothing has changed on your account.",
    ],
  });
