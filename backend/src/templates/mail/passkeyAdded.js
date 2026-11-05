import { greeting, mail, panel, paragraph } from "#src/templates/mail/layout.js";

const ADDED = "A new passkey was just added to your Whisprl account, and it can now be used to log in.";
const NOT_YOU = "Remove it in Settings, under Passkeys, then change your password, which logs out every other device.";

export default (name) =>
  mail({
    title: "A passkey was added to your account",
    preheader: ADDED,
    body: `
${greeting(name)}
${paragraph(ADDED)}
${panel("Not you?", NOT_YOU)}`,
    text: [`Hey ${name},`, "", ADDED, "", "Not you?", NOT_YOU],
  });
