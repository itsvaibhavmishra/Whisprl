const SITE = "https://whisprl.netlify.app";
const MEDIA = "https://res.cloudinary.com/twinkconnect/image/upload/email-media";
const MARK = `${MEDIA}/mark.png`;
const SUPPORT = "whisprlai@gmail.com";

const FONTS = "'Manrope','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// the header band stays navy in both modes, like the app's rail, so the one image never needs a dark variant
const BAND = "#0F1A2B";

// each letter a weight lighter than the last, the way the app draws the name
const wordmark = (name) => [...name].map((letter, position) => `<span style="font-weight:${Math.max(200, 800 - position * 100)};">${letter}</span>`).join("");

export const button = (href, label) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
  <tr>
    <td align="center" bgcolor="#0979C2" class="cta" style="border-radius:12px;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:50px;v-text-anchor:middle;width:270px;" arcsize="24%" stroke="f" fillcolor="#0979C2">
      <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${href}" style="display:inline-block;padding:16px 34px;font-family:${FONTS};font-size:16px;font-weight:800;letter-spacing:-0.01em;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;

// names and reasons are typed by people, so they go into the HTML as text and never as markup
export const escapeHtml = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const paragraph = (content) => `
<p class="text" style="margin:0 0 16px;font-family:${FONTS};font-size:16px;line-height:1.65;color:#1E2A3D;">${content}</p>`;

export const greeting = (name) => paragraph(`Hey ${escapeHtml(name)},`);

export const heading = (content) => `
<p class="text" style="margin:0 0 20px;font-family:${FONTS};font-size:17px;font-weight:800;letter-spacing:-0.01em;line-height:1.4;color:#0F1A2B;">${content}</p>`;

export const rule = () => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:26px 0;">
  <tr><td class="divider" style="border-top:1px solid #DCE3EE;font-size:0;line-height:0;">&nbsp;</td></tr>
</table>`;

export const panel = (label, content) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr>
    <td class="panel" style="padding:18px 20px;background-color:#F1F4F9;border-left:3px solid #0979C2;border-radius:0 12px 12px 0;">
      <p class="muted" style="margin:0 0 6px;font-family:${FONTS};font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#5F6E86;">${label}</p>
      <div class="text" style="font-family:${FONTS};font-size:15px;line-height:1.6;color:#1E2A3D;">${content}</div>
    </td>
  </tr>
</table>`;

const head = (title) => `
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&amp;display=swap" rel="stylesheet" />
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
  a { color:#0979C2; }
  @media only screen and (max-width:620px) {
    .wrap { width:100% !important; }
    .pad { padding-left:22px !important; padding-right:22px !important; }
    .band { padding:28px 22px !important; }
    .code { font-size:30px !important; letter-spacing:8px !important; }
    .cta a { display:block !important; }
  }
  @media (prefers-color-scheme: dark) {
    .canvas { background-color:#080D15 !important; }
    .card { background-color:#141D2E !important; border-color:#273349 !important; }
    .text { color:#E9EEF6 !important; }
    .muted { color:#93A1B8 !important; }
    .panel { background-color:#0E1626 !important; }
    .divider { border-color:#273349 !important; }
    a { color:#4CC3F0 !important; }
    .cta a { color:#ffffff !important; }
  }
  [data-ogsc] .canvas { background-color:#080D15 !important; }
  [data-ogsc] .card { background-color:#141D2E !important; border-color:#273349 !important; }
  [data-ogsc] .text { color:#E9EEF6 !important; }
  [data-ogsc] .muted { color:#93A1B8 !important; }
  [data-ogsc] .panel { background-color:#0E1626 !important; }
  [data-ogsc] .cta a { color:#ffffff !important; }
</style>`;

const header = () => `
<tr>
  <td class="band" align="center" bgcolor="${BAND}" style="padding:32px 32px 28px;background-color:${BAND};border-radius:16px 16px 0 0;">
    <img src="${MARK}" width="54" height="54" alt="" style="display:block;margin:0 auto 12px;width:54px;height:54px;border-radius:15px;" />
    <div style="font-family:${FONTS};font-size:31px;line-height:1;letter-spacing:-0.045em;color:#ffffff;">${wordmark("Whisprl")}</div>
  </td>
</tr>
<tr>
  <td height="3" style="height:3px;line-height:3px;font-size:0;background-color:#22D3EE;background-image:linear-gradient(90deg,#0979C2 0%,#22D3EE 50%,#4CC3F0 100%);">&nbsp;</td>
</tr>`;

const footer = (extra) => `
<tr>
  <td class="pad" style="padding:22px 36px 34px;">
    ${extra}
    <p class="muted" style="margin:0 0 6px;font-family:${FONTS};font-size:12.5px;line-height:1.6;color:#5F6E86;">
      Whisprl, the real-time chat app for you and your friends.
      <a href="${SITE}" style="color:#5F6E86;text-decoration:underline;">whisprl.netlify.app</a>
    </p>
    <p class="muted" style="margin:0;font-family:${FONTS};font-size:12.5px;line-height:1.6;color:#5F6E86;">
      Questions? Write to <a href="mailto:${SUPPORT}" style="color:#5F6E86;text-decoration:underline;">${SUPPORT}</a>.
    </p>
  </td>
</tr>`;

// the preview line inboxes show beside the subject, padded so the body does not leak into it
const preview = (preheader) =>
  `<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;font-size:1px;line-height:1px;color:#ffffff;">${preheader}${"&#8203;&nbsp;".repeat(60)}</div>`;

export const mail = ({ title, preheader, body, footerNote = "", text }) => ({
  html: `<!doctype html>
<html lang="en" style="color-scheme:light dark;">
<head>${head(title)}</head>
<body class="canvas" style="margin:0;padding:0;background-color:#EEF3F9;">
${preview(preheader)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="canvas" style="background-color:#EEF3F9;">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:600px;">
        ${header()}
        <tr>
          <td class="card pad" style="padding:34px 36px 32px;background-color:#ffffff;border:1px solid #DCE3EE;border-top:0;border-radius:0 0 16px 16px;">
${body}
          </td>
        </tr>
        ${footer(footerNote)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`,
  text: [...text, "", "--", "Whisprl, the real-time chat app for you and your friends.", SITE, `Questions? Write to ${SUPPORT}.`].join("\n"),
});
