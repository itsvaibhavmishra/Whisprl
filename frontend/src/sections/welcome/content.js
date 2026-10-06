import {
  ChatCircleDots,
  ImageSquare,
  Lightning,
  Palette,
  ShieldCheck,
  UserPlus,
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
    Icon: ChatCircleDots,
    title: "Typing and online status",
    body: "See when a friend is online, and when they are typing back to you.",
  },
  {
    Icon: ImageSquare,
    title: "Photos and documents",
    body: "Send photos with a caption, share documents, and open any image full screen.",
  },
  {
    Icon: UserPlus,
    title: "Friend requests",
    body: "Find people, send a request, and hear about it the moment it is accepted.",
  },
  {
    Icon: ShieldCheck,
    title: "Sign in your way",
    body: "Use your email with a one-time code, or your Google, GitHub or LinkedIn account.",
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
    role: "Stores accounts, conversations and every message sent.",
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
      "Whisprl is a free, real-time chat app that runs in your browser. Add your friends, message them one to one, share photos and documents, and see when they are online or typing.",
  },
  {
    question: "Is Whisprl free?",
    answer: "Yes. Creating an account and chatting with your friends costs nothing.",
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
