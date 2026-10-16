import createHttpError from "http-errors";

export const CELLS = 9;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const emptyCellsOf = (board) => board.flatMap((mark, cell) => (mark === null ? [cell] : []));

export const winningLineOf = (board) =>
  LINES.find(([first, ...rest]) => board[first] !== null && rest.every((cell) => board[cell] === board[first])) ?? null;

// a seat's index is its mark; X opens the first game, and each rematch the other seat does
export const setup = (previous) => {
  const first = previous ? 1 - previous.first : 0;
  return { board: Array(CELLS).fill(null), turn: first, first };
};

export const turnOf = (state) => state.turn;

export const play = (state, seat, cell) => {
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) throw createHttpError.BadRequest("That square does not exist");
  if (state.board[cell] !== null) throw createHttpError.BadRequest("That square is taken");
  return { ...state, board: state.board.map((mark, at) => (at === cell ? seat : mark)), turn: 1 - seat };
};

export const outcome = ({ board }) => {
  const line = winningLineOf(board);
  if (line) return { winners: [board[line[0]]] };
  return emptyCellsOf(board).length ? null : { winners: [] };
};

// nothing is hidden, so everyone sees the whole board; only the player to move gets moves to make
export const viewFor = (state, seat) => ({
  ...state,
  line: winningLineOf(state.board),
  legalMoves: seat === state.turn && !outcome(state) ? emptyCellsOf(state.board) : [],
});
