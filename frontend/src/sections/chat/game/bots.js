import Bleep from "@/assets/bots/bleep.webp";
import Pip from "@/assets/bots/pip.webp";
import Pogo from "@/assets/bots/pogo.webp";
import Wini from "@/assets/bots/wini.webp";
import Zook from "@/assets/bots/zook.webp";
import { isChosenBot } from "@/sections/chat/game/seats";

// the bot covering for a player who left keeps this name and the plain robot face
export const BOT_NAME = "Whisprl Bot";

const glow = (light, deep) => `linear-gradient(135deg, ${light}, ${deep})`;

// each sits on a gradient from its own family of colours, a shade off its body so the head still stands out
const PERSONAS = {
  bleep: { name: "Bleep", face: Bleep, backdrop: glow("#B9A6FF", "#5B8CFF") },
  wini: { name: "Wini", face: Wini, backdrop: glow("#FFC9A8", "#FF6F9F") },
  pip: { name: "Pip", face: Pip, backdrop: glow("#9EEBC4", "#1FA987") },
  zook: { name: "Zook", face: Zook, backdrop: glow("#FFE66B", "#FF9A1F") },
  pogo: { name: "Pogo", face: Pogo, backdrop: glow("#FFB877", "#D2502E") },
};

// reads a seat or a winner alike, since a win keeps the face the bot wore
export const personaOf = (seat) => (isChosenBot(seat) ? PERSONAS[seat.persona] : undefined);

export const botNameOf = (seat) => personaOf(seat)?.name ?? BOT_NAME;
