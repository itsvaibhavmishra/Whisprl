import { lazy } from "react";

import art from "@/sections/chat/game/games/dots-and-boxes/art";
import masthead from "@/sections/chat/game/games/dots-and-boxes/masthead.json";
import PALETTE, { colourOf } from "@/sections/chat/game/games/dots-and-boxes/palette";
import SizePreview from "@/sections/chat/game/games/dots-and-boxes/SizePreview";

// a seat index is 0, so a drawn line or a claimed box is counted by what it is not
const drawnIn = (state) => state?.lines.filter((drawnBy) => drawnBy !== null).length ?? 0;
const claimedIn = (state) => state?.boxes.filter((owner) => owner !== null).length ?? 0;

const dotsAndBoxes = {
  id: "dots-and-boxes",
  name: "Dots and Boxes",
  summary: "Close a box to claim it, and go again. For two to six players.",
  keywords: ["squares", "lines", "dot game", "pencil and paper", "timbiriche"],
  art,
  preload: [art.scene, art.board, art.notebook, art.cat, art.title],
  theme: {
    surface: "#A9743F",
    card: "rgba(255, 248, 236, 0.93)",
    ink: "#4A3321",
    accent: "#E8544A",
    // a triple rather than a colour, because the start screen's wash mixes it at several strengths
    shade: "30, 18, 10",
    marks: PALETTE,
  },
  // one piece rather than separate words, so the whole wordmark drops in together
  title: { ratio: 1210 / 811, words: [{ word: "dots-and-boxes", src: art.title, left: 0, top: 0, width: 1, height: 1 }] },
  width: { min: 400, preferred: 620, max: 820 },
  options: [
    {
      key: "size",
      label: "Board size",
      choices: [
        { value: 3, label: "3 × 3", note: "Quick" },
        { value: 4, label: "4 × 4", note: "Standard" },
        { value: 5, label: "5 × 5", note: "Long" },
      ],
      Preview: SizePreview,
      // four boxes a player, the same cap the server enforces when the setting arrives
      unavailable: (size, players) => {
        const most = Math.floor((size * size) / 4);
        return players > most ? `Up to ${most} players` : null;
      },
    },
  ],
  // Feel good island by Brandon75689, CC0, from opengameart.org
  music: art.music,
  rules: [
    { heading: "The aim", text: "Claim more boxes than anyone else.", picture: "aim" },
    { heading: "Your turn", text: "Draw one line between two dots that sit side by side, across or down.", picture: "turn" },
    {
      heading: "Claiming a box",
      text: "Draw the fourth side of a box and it's yours, marked in your colour. Claiming a box earns you another turn straight away.",
      picture: "claim",
    },
    { heading: "The end", text: "When every line is drawn, whoever holds the most boxes wins. If the most is shared, it's a draw.", picture: "end" },
    {
      heading: "Board size",
      text: "Pick a 3 × 3, 4 × 4 or 5 × 5 board before you start. A bigger board makes a longer game and seats more players, four boxes for each.",
      picture: "sizes",
    },
  ],
  moveSound: (before, state) => (claimedIn(state) > claimedIn(before) ? "box" : "pencil"),
  moveCountOf: (state) => drawnIn(state),
  colourOf,
  // lazy, like the board, so anything that only reads the catalog never loads its animation code
  Masthead: lazy(() => import("@/sections/chat/game/games/dots-and-boxes/Masthead")),
  // the stage's shape, which sizes the scene around it and holds its place while it loads
  mastheadRatio: masthead.stage.width / masthead.stage.height,
  Board: lazy(() => import("@/sections/chat/game/games/dots-and-boxes/Board")),
  RulesArt: lazy(() => import("@/sections/chat/game/games/dots-and-boxes/RulesArt")),
};

export default dotsAndBoxes;
