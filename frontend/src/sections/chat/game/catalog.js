import { lazy } from "react";

// a game looks how it was drawn, with no light or dark mode, and its board loads only once it opens
export const GAMES = {
  "tic-tac-toe": {
    name: "Tic-tac-toe",
    summary: "Three in a row wins. For two players.",
    seatMarks: ["X", "O"],
    theme: { surface: "#1E3A34", raised: "#284A42", ink: "#EEF2E6", marks: ["#F4CD5A", "#F49B8B"] },
    // the room its panel takes beside the chat on a wide screen, which each person can resize between the bounds
    width: { min: 380, preferred: 560, max: 820 },
    moveSound: "chalk",
    moveCountOf: (state) => state?.board.filter((mark) => mark !== null).length ?? 0,
    Board: lazy(() => import("@/sections/chat/game/boards/TicTacToeBoard")),
  },
};

export const GAME_IDS = Object.keys(GAMES);
