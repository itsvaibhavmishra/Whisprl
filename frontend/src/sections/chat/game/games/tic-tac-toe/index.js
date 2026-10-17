import { lazy } from "react";

import art from "@/sections/chat/game/games/tic-tac-toe/art";
import Mark from "@/sections/chat/game/games/tic-tac-toe/Marks";
import wordmark from "@/sections/chat/game/games/tic-tac-toe/title.json";

const ticTacToe = {
  id: "tic-tac-toe",
  name: "Tic-tac-toe",
  summary: "Three in a row wins. For two players.",
  // a game looks how it was drawn, with no light or dark mode, and its art loads only once it opens
  art,
  // every file the canvas waits for before the game animates in
  preload: [art.scene, art.board, ...Object.keys(wordmark.words).map(art.wordOf)],
  theme: {
    surface: "#C9A4F2",
    card: "rgba(255, 255, 255, 0.88)",
    ink: "#3B2E5A",
    accent: "#6B4FF7",
    // a deep violet, so the start screen's wash darkens the lilac evening rather than muddying it
    shade: "36, 20, 64",
    marks: ["#6B4FF7", "#F45762"],
  },
  // cut into words so each lands on its own, positioned as fractions of the whole
  title: {
    ratio: wordmark.wordmark.width / wordmark.wordmark.height,
    words: Object.entries(wordmark.words).map(([word, box]) => ({ word, src: art.wordOf(word), ...box })),
  },
  // the room its panel takes beside the chat on a wide screen, which each person can resize between the bounds
  width: { min: 380, preferred: 560, max: 820 },
  moveSound: "chalk",
  // Magic Puzzle In-Game 1 by MintoDog, CC0, from opengameart.org
  music: art.music,
  moveCountOf: (state) => state?.board.filter((mark) => mark !== null).length ?? 0,
  Mark,
  Board: lazy(() => import("@/sections/chat/game/games/tic-tac-toe/Board")),
};

export default ticTacToe;
