import {
  ChatCircleDotsIcon,
  CircleDashedIcon,
  ImageSquareIcon,
  LightningIcon,
  LockSimpleIcon,
  PaletteIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

export const CONVERSATION = [
  { from: "you", parts: ["psst… anyone up for a game?"] },
  { from: "whisprl", parts: ["Always. Jackaroo, Chain Reaction or Dots and Boxes?"] },
  { from: "you", parts: ["jackaroo. deal me in!"] },
  { from: "whisprl", game: "jackaroo" },
];

export const FEATURES = [
  {
    Icon: LightningIcon,
    title: "Messages in real time",
    body: "Every message arrives the instant it is sent. No refreshing, no waiting.",
  },
  {
    Icon: LockSimpleIcon,
    title: "End-to-end encrypted",
    body: "Messages, photos, videos, voice messages and statuses for friends are locked on your device before they leave it, so only the people they are for can open them.",
  },
  {
    Icon: UsersThreeIcon,
    title: "Group chats",
    body: "Chat with up to 32 friends at once, mention anyone with @, and pin the messages that matter.",
  },
  {
    Icon: ImageSquareIcon,
    title: "Photos, videos and voice messages",
    body: "Send photos and videos together as one gallery, record a voice message, share documents, or send a photo or video that opens only once.",
  },
  {
    Icon: CircleDashedIcon,
    title: "Status",
    body: "Share a photo, a video or a few words with your friends for 24 hours, and see who has seen it.",
  },
  {
    Icon: ChatCircleDotsIcon,
    title: "Typing and online status",
    body: "See when a friend is online, and when they are typing back to you.",
  },
  {
    Icon: UserPlusIcon,
    title: "Friend requests",
    body: "Find people, send a request, and hear about it the moment it is accepted.",
  },
  {
    Icon: ShieldCheckIcon,
    title: "One tap to get in",
    body: "Sign in with your Google account. There is no password to make or remember.",
  },
  {
    Icon: PaletteIcon,
    title: "Make it yours",
    body: "Switch between dark and light mode, and pick one of six accent colours.",
  },
];

export const FAQS = [
  {
    question: "What is Whisprl?",
    answer:
      "Whisprl is a free chat app with games built in. Start a game of Jackaroo, Chain Reaction, Dots and Boxes or Tic-tac-toe inside any chat, and keep talking while you play. Message friends one to one or in groups, share photos, videos, voice messages and documents, and post a status for 24 hours.",
  },
  {
    question: "Is Whisprl free?",
    answer: "Yes. Creating an account, chatting and playing with your friends costs nothing.",
  },
  {
    question: "Can anyone else read my messages?",
    answer:
      "No. Your messages, photos, videos, voice messages, documents, reactions and the statuses you share with friends are encrypted on your device before they leave it, and only the people they are for hold the keys to open them. Whisprl's servers store them, but cannot read them. Games are the one exception: the server runs every move, so nobody can cheat.",
  },
  {
    question: "Who can I play with?",
    answer:
      "Anyone you chat with. Play a friend one to one, start a game for your whole group, or take on one of Whisprl's bots when nobody else is around. Each chat keeps its own leaderboard for every game.",
  },
  {
    question: "Is Whisprl open source?",
    answer: "Yes. The full source code is on GitHub under the CC0 licence, so you can read it, run your own copy or build on it.",
  },
  {
    question: "Does Whisprl work on my phone?",
    answer: "Yes. Whisprl works in any modern browser and fits phones, tablets and desktops alike. The Android app is in testing on Google Play.",
  },
  {
    question: "How do I start chatting?",
    answer:
      "Continue with your Google account. Then add your friends, say hello and challenge them to a game. Whisprl, the official account, is your first friend and always up for one.",
  },
];
