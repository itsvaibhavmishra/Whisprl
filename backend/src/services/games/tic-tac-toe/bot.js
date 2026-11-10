import { emptyCellsOf, outcome, winningLineOf } from "#src/services/games/tic-tac-toe/rules.js";

const CENTRE = 4;
const CORNERS = [0, 2, 6, 8];

const withMark = (board, cell, mark) => board.map((current, at) => (at === cell ? mark : current));

const winningCellFor = (board, mark) => emptyCellsOf(board).find((cell) => winningLineOf(withMark(board, cell, mark))) ?? null;

const anyOf = (cells) => (cells.length ? cells[Math.floor(Math.random() * cells.length)] : null);

// how often each level plays without looking; played well this game cannot be won, so even the expert looks away now and then
export const DISTRACTED = { dumb: 0.7, medium: 0.3, pro: 0.08, expert: 0.03, standIn: 0.55 };

const solved = new Map();

// a finished board was won by whoever moved last, never by the player now to move
const valueOfFinished = ({ winners }) => (winners.length ? -1 : 0);

// what the player to move can force from here: 1 a win, 0 a draw, -1 a loss; a board has few enough positions to remember them all
const valueFor = (board, mover) => {
  const key = `${board.join(",")}|${mover}`;
  if (solved.has(key)) return solved.get(key);
  const finished = outcome({ board });
  const value = finished ? valueOfFinished(finished) : Math.max(...emptyCellsOf(board).map((cell) => -valueFor(withMark(board, cell, mover), 1 - mover)));
  solved.set(key, value);
  return value;
};

// a perfect player: it never loses, so the best anyone can do against it is a draw
const expertMove = (board, seat) => {
  const scored = emptyCellsOf(board).map((cell) => ({ cell, value: -valueFor(withMark(board, cell, seat), 1 - seat) }));
  const best = Math.max(...scored.map(({ value }) => value));
  return anyOf(scored.filter(({ value }) => value === best).map(({ cell }) => cell));
};

export const botMove = ({ board }, seat, level = "medium") => {
  const free = emptyCellsOf(board);
  const win = winningCellFor(board, seat);
  // a free win is always taken, because losing to a bot that walked past one feels cheap
  if (win !== null) return win;
  if (Math.random() < DISTRACTED[level]) return anyOf(free);
  if (level === "expert") return expertMove(board, seat);
  return winningCellFor(board, 1 - seat) ?? (board[CENTRE] === null ? CENTRE : null) ?? anyOf(CORNERS.filter((cell) => board[cell] === null)) ?? anyOf(free);
};

export const BOT_MOODS = { threatened: "worried", blocked: "proud" };

export const momentFor = (before, after, seat) => {
  const rival = 1 - seat;
  if (before.turn === rival && winningCellFor(after.board, rival) !== null) return "threatened";
  const threat = winningCellFor(before.board, rival);
  if (before.turn === seat && threat !== null && after.board[threat] === seat) return "blocked";
  return null;
};
