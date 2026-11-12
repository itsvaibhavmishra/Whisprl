import { escapeHtml, greeting, mail, panel, paragraph } from "#src/templates/mail/layout.js";

const NOT_YOU = "Reset your password with “Forgot your password?” on the login page. That logs out every device, this one included.";

const loggedInFrom = (device) =>
  `Someone just logged in to your Whisprl account from ${device}, a device it hasn't been used on before. If that was you, there's nothing to do.`;

export default (name, device) =>
  mail({
    title: "New login to your account",
    preheader: escapeHtml(loggedInFrom(device)),
    body: `
${greeting(name)}
${paragraph(escapeHtml(loggedInFrom(device)))}
${panel("Not you?", NOT_YOU)}`,
    text: [`Hey ${name},`, "", loggedInFrom(device), "", "Not you?", NOT_YOU],
  });
