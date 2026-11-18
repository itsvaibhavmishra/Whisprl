import { escapeHtml, greeting, mail, panel, paragraph } from "#src/templates/mail/layout.js";

const NOT_YOU = "Log in to Whisprl and choose Log out other devices in Settings, under Security, then check your Google account's security.";

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
