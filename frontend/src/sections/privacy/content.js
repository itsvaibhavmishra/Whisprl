import { CONTACT_EMAIL, PORTFOLIO_URL } from "@/config";
import { PATH_DOCS } from "@/routes/paths";

export const LAST_UPDATED = "19 October 2026";

export const INTRO = [
  "This privacy policy covers Whisprl, the free chat app at whisprl.netlify.app and on Android, run by ",
  { label: "Vaibhaw Mishra", href: PORTFOLIO_URL },
  ". It explains what Whisprl collects, why, who else handles it, how long it is kept and how to have it deleted.",
];

export const SECTIONS = [
  {
    id: "in-short",
    title: "In short",
    blocks: [
      {
        list: [
          "Messages, photos, videos, voice messages, documents, reactions and statuses shared with friends are end-to-end encrypted. Whisprl stores them but cannot read them.",
          "Whisprl keeps what it needs to run your account and deliver your messages, and nothing for advertising.",
          "Your data is not sold, and Whisprl shows no ads.",
          "You can delete your account at any time.",
        ],
      },
    ],
  },
  {
    id: "what-you-give",
    title: "What you give Whisprl",
    blocks: [
      {
        list: [
          "your name, email address and password when you sign up. Signing in with Google, GitHub or LinkedIn gives Whisprl your name, email address and profile picture from that account instead of a password",
          "your birthday, to check you are at least 13. Friends see the day and month, never the year, unless you hide it",
          "a username, profile picture, cover and status line, which other people on Whisprl can see",
          "the messages, photos, videos, voice messages, documents, reactions and statuses you send",
          "reports you make, with any messages you choose to attach",
          "game requests you send: the game's name, and any links and details you add",
          "the reason you give, and any note, if you delete your account",
        ],
      },
    ],
  },
  {
    id: "what-is-recorded",
    title: "What Whisprl records as you use it",
    blocks: [
      {
        list: [
          "your friends, friend requests, blocked people, groups and conversations, and settings such as muted chats, disappearing messages and who sees your status",
          "whether you are online, which your friends can see",
          "who has viewed each status, shown only to the person who posted it",
          "the games you play in a chat: who sits where, every move and the result",
          "the days you open Whisprl, which staff see only as a count of active people",
          "for each device you log in on, the kind of browser or device it is and, in the Android app, a token for sending it notifications",
          "the public half of your encryption keys, of each device's login key and of any passkey you add. A public key can only lock a message or check a sign-in, never open or make one",
          "your password and one-time codes, as one-way hashes only, so nobody can read them, including the people who run Whisprl",
          "error reports when something in Whisprl breaks, described under Services that handle your data",
        ],
      },
    ],
  },
  {
    id: "encryption",
    title: "What Whisprl cannot read",
    blocks: [
      "Messages, photos, videos, voice messages, documents, reactions and statuses shared with friends are locked on your device before they leave it, with keys only the people in that conversation hold. Whisprl's servers and Cloudinary store them locked, and nobody who runs Whisprl can open them.",
      "Some things are not encrypted, because everyone they are shown to has to be able to see them: profile pictures and covers, a group's name and picture, statuses shared with everyone, and messages sent before encryption arrived. Games are not encrypted either, because the server referees each one so nobody can cheat. The chat beside a game still is.",
      "Staff only ever see a message when someone in that conversation reports it. Their own device then opens the reported message and the ones around it and sends them with the report, which the report dialog says before anything is sent.",
      "In the Android app, your encryption key is also kept in Google's Block Store, so reinstalling the app does not lock your messages. With a screen lock on your phone, that copy reaches Google's backup end-to-end encrypted, so Google cannot read it either. Logging out deletes it.",
    ],
  },
  {
    id: "permissions",
    title: "What the Android app asks for",
    blocks: [
      {
        list: [
          "the microphone, only while you record a voice message",
          "notifications, to tell you about new messages. Each notification arrives still encrypted and is opened on your phone",
          "your fingerprint, face or screen lock, to confirm it is you before making a new recovery key. Whisprl never sees them, only whether Android confirmed you",
        ],
      },
      "Photos, videos and documents are only ever the ones you pick to send. Whisprl does not read your contacts, location or other files.",
    ],
  },
  {
    id: "how-it-is-used",
    title: "How it is used",
    blocks: [
      "Whisprl uses your data to sign you in, deliver your messages and notifications, show you to the people you talk to, keep accounts safe from spam and abuse, count how many people use it, and fix what breaks. It is not used for advertising or to build a profile of you.",
    ],
  },
  {
    id: "services",
    title: "Services that handle your data",
    blocks: [
      "Whisprl relies on these services, each of which handles your data under its own privacy policy:",
      {
        list: [
          "Netlify, which hosts the website, and Northflank, which runs the server. Like any website, they see your IP address when you connect",
          "MongoDB Atlas, which stores the server's database",
          "Cloudinary, which stores the files you send, encrypted, and profile pictures, covers and statuses shared with everyone, which are not",
          "Gmail, which sends your codes and account emails, so it receives your email address",
          "Firebase Cloud Messaging, by Google, which delivers notifications to the Android app. A notification carries your message still encrypted",
          "Google, GitHub and LinkedIn, if you sign in with them",
          "Google reCAPTCHA, on sign-up and log-in, to keep bots out. It receives information about your device and how you use the page",
          "Google Analytics, to count visits and see which pages are used. It receives the pages you open and information about your device, never your messages",
          "Sentry, to tell us when something breaks. A report, stored in Frankfurt, holds what went wrong, your device, your Whisprl version and your account number, never your messages, anything on your screen or your IP address",
        ],
      },
    ],
  },
  {
    id: "who-sees-it",
    title: "Who else sees it",
    blocks: [
      "The people you talk to see what you send them, your profile, and whether you are online. Your email address is never shown to anyone.",
      "Staff, meaning the owner and any admins, can see account details other than passwords, the reports and game requests sent to them, and what the server holds unencrypted, so they can keep Whisprl safe. Every staff action needs a passkey and is recorded.",
      "Whisprl does not sell your data or share it for advertising. It discloses data only when the law requires it, and even then it cannot hand over what it cannot read.",
    ],
  },
  {
    id: "storage",
    title: "Cookies and storage on your device",
    blocks: [
      "Whisprl sets no cookies of its own. It keeps the key that keeps you logged in, your encryption key and preferences such as dark mode in your browser's storage, or the app's. Google Analytics and reCAPTCHA set cookies of their own.",
    ],
  },
  {
    id: "retention",
    title: "How long it is kept",
    blocks: [
      {
        list: [
          "your account, until you delete it",
          "messages, until they are deleted, or for 24 hours, 7 days or 90 days in a chat with disappearing messages on",
          "statuses, for 24 hours",
          "a device's login, until you log out or after 90 days without use",
          "one-time codes, for 10 minutes",
          "messages attached to a report, until 90 days after the report is closed",
          "error reports, for as long as Sentry keeps them, after which it deletes them",
        ],
      },
      {
        parts: [
          "Deleting your account hides it straight away and removes it 14 days later. A few things stay, such as the chats the people you talked to keep with you, and ",
          { label: "Deleting your account", to: PATH_DOCS.general.deleteAccount },
          " lists them.",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "How it is protected",
    blocks: [
      "Everything travels over HTTPS. Messages and files between friends are end-to-end encrypted. Passwords and codes are stored only as one-way hashes. Each login is tied to a key your device keeps and never shares, so a stolen token alone cannot keep someone signed in. Staff need a passkey for every action, and every action is recorded.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices",
    blocks: [
      {
        list: [
          "change your name, username, photo, cover and status line in Settings, then Profile",
          "choose who sees your status, whether friends see your birthday, and whether friends of your friends see you in People you may know, in Settings, then Privacy",
          "delete any message you sent, for everyone in the chat",
          "turn on disappearing messages in a chat with one person, or in a group you manage",
          "delete your account from Settings, then Account",
        ],
      },
      {
        parts: [
          "To ask for a copy of your data, to correct it, or anything else about your privacy, email ",
          { email: CONTACT_EMAIL },
          ". Requests are answered as soon as possible, and within 30 days.",
        ],
      },
    ],
  },
  {
    id: "children",
    title: "Children",
    blocks: [
      {
        parts: [
          "Whisprl is not for anyone under 13, and sign-up asks for a birthday to check. If you believe a child under 13 has an account, email ",
          { email: CONTACT_EMAIL },
          " and it will be removed. The ",
          { label: "child safety standards", to: PATH_DOCS.general.childSafety },
          " explain how Whisprl protects young people.",
        ],
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    blocks: ["When this policy changes, the date at the top changes with it."],
  },
  {
    id: "contact",
    title: "Contact",
    blocks: [{ parts: ["For anything about your privacy, email Whisprl at ", { email: CONTACT_EMAIL }, "."] }],
  },
];
