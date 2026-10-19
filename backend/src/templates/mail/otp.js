import { mail, panel, paragraph } from "#src/templates/mail/layout.js";

// one block rather than a digit per circle, so the code can be copied in a single go
export const codeBlock = (otp) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px;">
  <tr>
    <td class="panel" align="center" style="padding:24px 16px;background-color:#F1F4F9;border:1px solid #DCE3EE;border-radius:14px;">
      <div class="text code" style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:36px;font-weight:700;letter-spacing:11px;line-height:1.2;color:#0F1A2B;text-indent:11px;">${otp}</div>
    </td>
  </tr>
</table>`;

export default (name, otp) =>
  mail({
    title: "Your Whisprl code",
    preheader: `${otp} is your Whisprl verification code. It expires in 10 minutes.`,
    body: `
${paragraph(`Hey ${name},`)}
${paragraph("Here is the code to confirm your email address.")}
${codeBlock(otp)}
${panel("Good to know", "The code works for 10 minutes, and only once. Never share it with anyone, including anyone saying they are from Whisprl.")}
${paragraph('<span style="color:#5F6E86;" class="muted">If you did not try to sign in or sign up, you can ignore this email. Nothing has changed on your account.</span>')}`,
    text: [
      `Hey ${name},`,
      "",
      "Here is the code to confirm your email address.",
      "",
      `    ${otp}`,
      "",
      "The code works for 10 minutes, and only once. Never share it with anyone, including anyone saying they are from Whisprl.",
      "",
      "If you did not try to sign in or sign up, you can ignore this email. Nothing has changed on your account.",
    ],
  });
