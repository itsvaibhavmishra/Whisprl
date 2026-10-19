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
${panel("Good to know", "The code works for 10 minutes, and only once. Your account is deleted 14 days after you confirm, and logging in before then keeps it.")}
${paragraph('<span style="color:#5F6E86;" class="muted">If you did not ask to delete your account, ignore this email and change your password. Nothing has changed on your account.</span>')}`,
    text: [
      `Hey ${name},`,
      "",
      "Here is the code to delete your Whisprl account. Enter it in Whisprl to confirm.",
      "",
      `    ${otp}`,
      "",
      "The code works for 10 minutes, and only once. Your account is deleted 14 days after you confirm, and logging in before then keeps it.",
      "",
      "If you did not ask to delete your account, ignore this email and change your password. Nothing has changed on your account.",
    ],
  });
