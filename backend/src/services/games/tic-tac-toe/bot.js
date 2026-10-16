import { emptyCellsOf, winningLineOf } from "#src/services/games/tic-tac-toe/rules.js";

const CENTRE = 4;
const CORNERS = [0, 2, 6, 8];

const winningCellFor = (board, mark) =>
  emptyCellsOf(board).find((cell) => winningLineOf(board.map((current, at) => (at === cell ? mark : current)))) ?? null;

const anyOf = (cells) => (cells.length ? cells[Math.floor(Math.random() * cells.length)] : null);

// an ordinary player: it takes a win and stops one, but never sees a fork coming
export const botMove = ({ board }, seat) =>
  winningCellFor(board, seat) ??
  winningCellFor(board, 1 - seat) ??
  (board[CENTRE] === null ? CENTRE : null) ??
  anyOf(CORNERS.filter((cell) => board[cell] === null)) ??
  anyOf(emptyCellsOf(board));
