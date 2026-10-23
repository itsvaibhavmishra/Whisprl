import { lazy } from "react";

import art from "@/sections/chat/game/games/jackaroo/art";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";
import masthead from "@/sections/chat/game/games/jackaroo/masthead.json";
import PALETTE, { colourOf } from "@/sections/chat/game/games/jackaroo/palette";

// the sign's own shape, width over height
const TITLE_RATIO = 1200 / 584;

const jackaroo = {
  id: "jackaroo",
  name: "Jackaroo",
  summary: "Race your marbles home with cards, knocking theirs out on the way. For two players.",
  keywords: ["jakaroo", "marbles", "cards", "race", "kings", "tock", "ludo"],
  art,
  // only what the start screen shows, so it is not kept waiting on the board's pieces
  preload: [art.scene, art.title, art.startBoard, ...masthead.marbles.map(({ tone }) => art.marble(tone))],
  theme: {
    // the rug at the scene's foot, so the scene fades into the room without a seam
    surface: "#2c1a14",
    card: "rgba(26, 16, 11, 0.86)",
    ink: "#F6EBDD",
    accent: "#F0B860",
    onAccent: "#3B1D0E",
    outline: "#E8C48A",
    // the rug's own dark brown, so the start screen's wash deepens the room rather than greying it
    shade: "26, 15, 10",
    marks: PALETTE,
    bar: "labelled",
    fonts: FONTS,
  },
  // only ever two seats, which face each other across the board
  versus: true,
  // the board puts the other player above it and you below, so the canvas leaves its own row of players out
  drawsPlayers: true,
  // one piece, so the whole wordmark drops in together
  title: { ratio: TITLE_RATIO, words: [{ word: "jackaroo", src: art.title, left: 0, top: 0, width: 1, height: 1 }] },
  width: { min: 380, preferred: 560, max: 820 },
  rules: [
    { heading: "The aim", text: "Bring all four of your marbles round the board and into your home before the other player does.", picture: "aim" },
    {
      heading: "Your turn",
      text: "A deck is dealt over three rounds: four cards each, four more, then five. On your turn, play a card. If none can move, throw one away, or your whole hand once nothing can change this round.",
      picture: "turn",
    },
    {
      heading: "Bringing a marble out",
      text: "You start with one marble out. An ace, a 2 or a king brings another from your base onto your start, the ringed hole at the corner of your side.",
      picture: "out",
    },
    {
      heading: "Moving",
      text: "A card moves a marble that many holes forward. On the way it can jump one marble, yours or theirs, but never two, and it can't land on your own. Nobody can pass or land on a marble sitting on its own start.",
      picture: "moving",
    },
    {
      heading: "Knocking out",
      text: "Land on their marble and it goes back to its base. Knocking a marble out earns you another card to play straight away, and so does a marble reaching the deepest hole still free in your home.",
      picture: "knockout",
    },
    {
      heading: "Special cards",
      text: "A 4 moves back. A 5 moves any marble, theirs too, though theirs never into their home. A 7 can be split between two of your marbles. A 10 moves 10, or makes the other player throw away a card of their choice instead of playing. A black jack swaps one of your marbles with one of theirs, a red jack moves 11. A black queen moves 12, a red queen throws away one of their cards, picked face down, and skips their turn. A king moves 13 and knocks out every marble it passes, your own too.",
      picture: "special",
    },
    {
      heading: "Swirls",
      text: "Land exactly on a swirl, moving forward or back with a 4, and your marble jumps across to the hole its arrow points at, even past your home.",
      picture: "swirls",
    },
    {
      heading: "Home",
      text: "Your home is the lane of four ringed holes in the middle of your side. A marble goes in on an exact count and never runs past it, and a marble parked in front of it blocks the way.",
      picture: "home",
    },
  ],
  // Eastern Arctic Dubstep by VishwaJai, CC0, from opengameart.org
  music: art.music,
  soundsItself: true,
  moveCountOf: (state) => state?.plays ?? 0,
  colourOf,
  // lazy, like the board, so anything that only reads the catalog never loads them
  Masthead: lazy(() => import("@/sections/chat/game/games/jackaroo/Masthead")),
  mastheadRatio: masthead.stage.width / masthead.stage.height,
  Wordmark: lazy(() => import("@/sections/chat/game/games/jackaroo/Wordmark")),
  Board: lazy(() => import("@/sections/chat/game/games/jackaroo/Board")),
  RulesArt: lazy(() => import("@/sections/chat/game/games/jackaroo/RulesArt")),
};

export default jackaroo;
