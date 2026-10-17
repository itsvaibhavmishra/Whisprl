import { emptyCellsOf, winningLineOf } from "#src/services/games/tic-tac-toe/rules.js";

const CENTRE = 4;
const CORNERS = [0, 2, 6, 8];

const winningCellFor = (board, mark) =>
  emptyCellsOf(board).find((cell) => winningLineOf(board.map((current, at) => (at === cell ? mark : current)))) ?? null;

const anyOf = (cells) => (cells.length ? cells[Math.floor(Math.random() * cells.length)] : null);

// played well this game cannot be won, so the bot looks away, and more often when standing in for someone
export const DISTRACTED = { opponent: 0.3, standIn: 0.55 };

export const botMove = ({ board }, seat, level = "opponent") => {
  const free = emptyCellsOf(board);
  const win = winningCellFor(board, seat);
  // a free win is always taken, because losing to a bot that walked past one feels cheap
  if (win !== null) return win;
  if (Math.random() < DISTRACTED[level]) return anyOf(free);
  return (
    winningCellFor(board, 1 - seat) ??
    (board[CENTRE] === null ? CENTRE : null) ??
    anyOf(CORNERS.filter((cell) => board[cell] === null)) ??
    anyOf(free)
  );
};
