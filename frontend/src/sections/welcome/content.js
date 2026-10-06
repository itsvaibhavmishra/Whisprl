import {
  ChatCircleDots,
  CircleDashed,
  ImageSquare,
  Lightning,
  LockSimple,
  Palette,
  ShieldCheck,
  UserPlus,
  UsersThree,
} from "phosphor-react";

import { COMMUNITY } from "@/config";

export const CONVERSATION = [
  { from: "you", parts: ["psst… anyone here?"] },
  { from: "whisprl", parts: ["Always. Messages land the moment you hit send."] },
  { from: "you", parts: ["how many people chat on here?"] },
  {
    from: "whisprl",
    parts: [
      { strong: COMMUNITY.people },
      " people, ",
      { strong: COMMUNITY.conversations },
      " conversations and ",
      { strong: COMMUNITY.messages },
      " messages so far. You'd fit right in.",
    ],
  },
];

export const FEATURES = [
  {
    Icon: Lightning,
    title: "Messages in real time",
    body: "Every message arrives the instant it is sent. No refreshing, no waiting.",
  },
  {
    Icon: LockSimple,
    title: "End-to-end encrypted",
    body: "Messages, photos, videos, voice messages and statuses are locked in your browser before they leave it, so only the people they are for can open them.",
  },
  {
    Icon: UsersThree,
    title: "Group chats",
    body: "Chat with up to 32 friends at once, mention anyone with @, and pin the messages that matter.",
  },
  {
    Icon: ImageSquare,
    title: "Photos, videos and voice messages",
    body: "Send photos and videos together as one gallery, record a voice message, share documents, or send a photo or video that opens only once.",
  },
  {
    Icon: CircleDashed,
    title: "Status",
    body: "Share a photo, a video or a few words with your friends for 24 hours, and see who has seen it.",
  },
  {
    Icon: ChatCircleDots,
    title: "Typing and online status",
    body: "See when a friend is online, and when they are typing back to you.",
  },
  {
    Icon: UserPlus,
    title: "Friend requests",
    body: "Find people, send a request, and hear about it the moment it is accepted.",
  },
  {
    Icon: ShieldCheck,
    title: "Sign in your way",
    body: "Log in with your email and password, a passkey, or your Google, GitHub or LinkedIn account.",
  },
  {
    Icon: Palette,
    title: "Make it yours",
    body: "Switch between dark and light mode, and pick one of six accent colours.",
  },
];

export const STACK = [
  {
    letter: "M",
    name: "MongoDB",
    role: "Stores accounts, conversations and every message, encrypted before it arrives.",
  },
  {
    letter: "E",
    name: "Express",
    role: "Serves the API the app talks to, rate limited and sanitised.",
  },
  {
    letter: "R",
    name: "React",
    role: "Draws the interface, with Redux keeping each chat in step.",
  },
  {
    letter: "N",
    name: "Node.js",
    role: "Runs the server, where Socket.io pushes each message out live.",
  },
];

export const FAQS = [
  {
    question: "What is Whisprl?",
    answer:
      "Whisprl is a free, real-time chat app that runs in your browser. Add your friends, message them one to one or in groups, share photos, videos, voice messages and documents, post a status for 24 hours, and see when they are online or typing.",
  },
  {
    question: "Is Whisprl free?",
    answer: "Yes. Creating an account and chatting with your friends costs nothing.",
  },
  {
    question: "Can anyone else read my messages?",
    answer:
      "No. Your messages, photos, videos, voice messages, documents, reactions and statuses are encrypted in your browser before they leave it, and only the people they are for hold the keys to open them. Whisprl's servers store them, but cannot read them.",
  },
  {
    question: "What is a MERN chat app?",
    answer:
      "A MERN chat app is built with MongoDB, Express, React and Node.js. Whisprl is built on that stack, with Socket.io delivering every message in real time.",
  },
  {
    question: "Is Whisprl open source?",
    answer:
      "Yes. The full source code is on GitHub under the CC0 licence, so you can read it, run your own copy or build on it.",
  },
  {
    question: "Does Whisprl work on my phone?",
    answer:
      "Yes. Whisprl works in any modern browser and fits phones, tablets and desktops alike.",
  },
  {
    question: "How do I start chatting?",
    answer:
      "Sign up with your email, or with Google, GitHub or LinkedIn. Then add your friends and start a conversation with any of them.",
  },
];
