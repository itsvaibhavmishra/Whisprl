import { button, greeting, mail, panel, paragraph, rule } from "#src/templates/mail/layout.js";

const FONTS = "'Manrope','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// the full address spelled out as well, for a client that will not follow the button
const fallback = (reset) => `
<p class="muted" style="margin:22px 0 0;font-family:${FONTS};font-size:13px;line-height:1.6;color:#5F6E86;">
  Or paste this into your browser:<br />
  <a href="${reset}" style="color:#0979C2;word-break:break-all;">${reset}</a>
</p>`;

export default (name, reset) =>
  mail({
    title: "Reset your Whisprl password",
    preheader: "Choose a new password. The link works for 10 minutes.",
    body: `
${greeting(name)}
${paragraph("Someone asked to reset the password on your Whisprl account. Choose a new one here.")}
<div style="margin:26px 0 4px;">${button(reset, "Choose a new password")}</div>
${fallback(reset)}
${rule()}
${panel("Good to know", "The link works for 10 minutes and can be used once. Your current password keeps working until you choose a new one.")}
${paragraph('<span style="color:#5F6E86;" class="muted">If you did not ask for this, you can ignore this email and nothing will change.</span>')}`,
    text: [
      `Hey ${name},`,
      "",
      "Someone asked to reset the password on your Whisprl account. Choose a new one here:",
      "",
      reset,
      "",
      "The link works for 10 minutes and can be used once. Your current password keeps working until you choose a new one.",
      "",
      "If you did not ask for this, you can ignore this email and nothing will change.",
    ],
  });
