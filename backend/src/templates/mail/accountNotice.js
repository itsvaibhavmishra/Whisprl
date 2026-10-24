import { escapeHtml, greeting, mail, panel, paragraph } from "#src/templates/mail/layout.js";

export default ({ name, heading, body, reason }) =>
  mail({
    title: heading,
    preheader: heading,
    body: `
${greeting(name)}
${paragraph(body)}
${panel("Why", escapeHtml(reason))}
${paragraph("If you think this is a mistake, reply to this email and tell us why. A person reads every reply.")}`,
    text: [
      `Hey ${name},`,
      "",
      body,
      "",
      "Why:",
      reason,
      "",
      "If you think this is a mistake, reply to this email and tell us why. A person reads every reply.",
    ],
  });
