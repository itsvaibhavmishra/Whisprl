import { button, greeting, mail, panel, paragraph } from "#src/templates/mail/layout.js";

const WHAT_GOES =
  "Your profile, username, friends, statuses and passkeys, and your place in every group. People you chatted with keep their chats, with you shown as “Whisprl user”.";

export default ({ name, day, loginUrl }) =>
  mail({
    title: "Your account will be deleted",
    preheader: `Your Whisprl account will be deleted on ${day}. Log in before then to keep it.`,
    body: `
${greeting(name)}
${paragraph(`You asked us to delete your Whisprl account, so it is hidden now and will be deleted on <strong>${day}</strong>. You have been logged out everywhere.`)}
${panel("What goes", WHAT_GOES)}
${panel("Changed your mind?", `Log in before ${day} and your account comes back exactly as it was.`)}
<div style="margin:4px 0 26px;">${button(loginUrl, "Keep my account")}</div>
${paragraph('<span style="color:#5F6E86;" class="muted">If you did not ask for this, log in now to keep your account, then change your password.</span>')}`,
    text: [
      `Hey ${name},`,
      "",
      `You asked us to delete your Whisprl account, so it is hidden now and will be deleted on ${day}. You have been logged out everywhere.`,
      "",
      "What goes:",
      WHAT_GOES,
      "",
      `Changed your mind? Log in before ${day} and your account comes back exactly as it was: ${loginUrl}`,
      "",
      "If you did not ask for this, log in now to keep your account, then change your password.",
    ],
  });
