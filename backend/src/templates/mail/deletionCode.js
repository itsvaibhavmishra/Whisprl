import { greeting, mail, panel, paragraph } from "#src/templates/mail/layout.js";

// one block rather than a digit per circle, so the code can be copied in a single go
const codeBlock = (otp) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
  <tr>
    <td class="panel" align="center" style="padding:24px 16px;background-color:#F1F4F9;border:1px solid #DCE3EE;border-radius:14px;">
      <div class="text code" style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;font-weight:700;letter-spacing:11px;line-height:1.2;color:#0F1A2B;text-indent:11px;">${otp}</div>
    </td>
  </tr>
</table>`;

export default (name, otp) =>
  mail({
    title: "Your code to delete your account",
    preheader: `${otp} is your code to delete your Whisprl account. It expires in 10 minutes.`,
    body: `
${greeting(name)}
${paragraph("Here is the code to delete your Whisprl account. Enter it in Whisprl to confirm.")}
${codeBlock(otp)}
${panel("Good to know", "The code works for 10 minutes, and only once. Your account is hidden as soon as you confirm and deleted 14 days later. Logging in before then brings it back.")}
${paragraph('<span style="color:#5F6E86;" class="muted">If you did not ask to delete your account, ignore this email. Nothing has changed on your account.</span>')}`,
    text: [
      `Hey ${name},`,
      "",
      "Here is the code to delete your Whisprl account. Enter it in Whisprl to confirm.",
      "",
      `    ${otp}`,
      "",
      "The code works for 10 minutes, and only once. Your account is hidden as soon as you confirm and deleted 14 days later. Logging in before then brings it back.",
      "",
      "If you did not ask to delete your account, ignore this email. Nothing has changed on your account.",
    ],
  });
