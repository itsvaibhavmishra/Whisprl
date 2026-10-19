import { button, greeting, heading, highlight, lead, mail, paragraph, rule, shot } from "#src/templates/mail/layout.js";

const SITE = "https://whisprl.netlify.app";
const PREVIEW = "https://res.cloudinary.com/twinkconnect/image/upload/email-media/collage.jpg";
const FONTS = "'Manrope','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const HIGHLIGHTS = [
  ["🔒", "Nobody can read your messages", "Not us, not anyone. Every message, photo, video and voice note is locked on your device before it leaves it."],
  ["💬", "Say it properly", "Reply, react, edit, pin, send a voice note up to 15 minutes, or round up 32 friends into one group."],
  ["✨", "Share your day, not forever", "Post a photo, video or note for 24 hours. Draw on it, write on it, and see exactly who looked."],
  ["🔍", "Find anyone", "Search all of Whisprl by name or @username, put a hello in your friend request, and never miss a birthday again."],
  ["🔑", "Lose the password", "Add a passkey and get in with your face or your fingerprint instead."],
];

// the one line that stops this becoming a list someone cannot leave
const optOut = `
<p class="muted" style="margin:0 0 14px;font-family:${FONTS};font-size:12.5px;line-height:1.6;color:#5F6E86;">
  You are getting this once, because you made an account back when it was called TwinkConnect.
  This is not a newsletter and there is nothing to subscribe to. Reply with "stop" and you will not hear from us again.
</p>`;

export default (name) =>
  mail({
    title: "TwinkConnect is now Whisprl",
    preheader: "Same account, same friends. Encrypted messages, group chats, voice notes and status updates are all new.",
    body: `
${greeting(name)}
${lead("Remember TwinkConnect? It is Whisprl now, and it is not the app you walked away from.")}
${shot(PREVIEW, "A Whisprl status playing, a voice note, a chat with a reply, and a friend request", SITE)}
${paragraph("Your account came through the rename untouched. Same email, same password, same friends, nothing to move.")}
${rule()}
${heading("Here is what you have been missing")}
${HIGHLIGHTS.map(([emoji, title, body]) => highlight(emoji, title, body)).join("")}
${paragraph("It is free, it is open source, and it is sitting exactly where you left it.")}
<div style="margin:28px 0 8px;">${button(SITE, "Open Whisprl")}</div>`,
    footerNote: optOut,
    text: [
      `Hey ${name},`,
      "",
      "Remember TwinkConnect? It is Whisprl now, and it is not the app you walked away from.",
      "",
      "Your account came through the rename untouched. Same email, same password, same friends, nothing to move.",
      "",
      "Here is what you have been missing",
      "",
      ...HIGHLIGHTS.map(([, title, body]) => `* ${title}. ${body}`),
      "",
      "It is free, it is open source, and it is sitting exactly where you left it.",
      "",
      `Open Whisprl: ${SITE}`,
      "",
      'You are getting this once, because you made an account back when it was called TwinkConnect. This is not a newsletter and there is nothing to subscribe to. Reply with "stop" and you will not hear from us again.',
    ],
  });
