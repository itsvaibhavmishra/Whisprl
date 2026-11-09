import { PATH_DASHBOARD } from "@/routes/paths";

const { chat, contacts, status } = PATH_DASHBOARD.general;

export const WHISPRL_CHAT = "whisprl-chat";
export const FIRST_GAME = "jackaroo";

// each line is also Whisprl's recorded voice, so changing one means recording its clip again
export const TOUR_STEPS = [
  {
    id: "welcome",
    text: "Hey there! I'm Whisprl. Welcome to your new home for private chats and fun games. Come on, let me show you around!",
  },
  { id: "contacts", page: contacts, target: "contacts", text: "This is Contacts! Invite your friends and connect with them, right here." },
  { id: "status", page: status, target: "status", text: "Over here is Status. Share little moments with your friends, and poof! They're gone after a day." },
  {
    id: "chats",
    page: chat,
    target: "chats",
    text: "And these are your chats. Everything you send is end-to-end encrypted, so only you and your friends can ever read it.",
  },
  { id: "whisprl", page: WHISPRL_CHAT, target: "chat-header", text: "And this is me! I don't really chat, but I'm always up for a game." },
  { id: "play", page: WHISPRL_CHAT, text: "So, how about a game of Jackaroo? It's one of my favourites. I'll be ready!" },
];
