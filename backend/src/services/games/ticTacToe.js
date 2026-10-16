import createHttpError from "http-errors";

const CELLS = 9;
const CENTRE = 4;
const CORNERS = [0, 2, 6, 8];
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

const emptyCellsOf = (board) => board.flatMap((mark, cell) => (mark === null ? [cell] : []));

const winningLineOf = (board) => LINES.find(([first, ...rest]) => board[first] !== null && rest.every((cell) => board[cell] === board[first])) ?? null;

const winningCellFor = (board, mark) =>
  emptyCellsOf(board).find((cell) => winningLineOf(board.map((current, at) => (at === cell ? mark : current)))) ?? null;

const anyOf = (cells) => (cells.length ? cells[Math.floor(Math.random() * cells.length)] : null);

const outcome = ({ board }) => {
  const line = winningLineOf(board);
  if (line) return { winners: [board[line[0]]] };
  return emptyCellsOf(board).length ? null : { winners: [] };
};

const ticTacToe = {
  id: "tic-tac-toe",
  minPlayers: 2,
  maxPlayers: 2,
  turnSeconds: 30,
  // a seat's index is its mark; X opens the first game, and each rematch the other seat does
  setup: (previous) => {
    const first = previous ? 1 - previous.first : 0;
    return { board: Array(CELLS).fill(null), turn: first, first };
  },
  turnOf: (state) => state.turn,
  play: (state, seat, cell) => {
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) throw createHttpError.BadRequest("That square does not exist");
    if (state.board[cell] !== null) throw createHttpError.BadRequest("That square is taken");
    return { ...state, board: state.board.map((mark, at) => (at === cell ? seat : mark)), turn: 1 - seat };
  },
  outcome,
  // an ordinary player: it takes a win and stops one, but never sees a fork coming
  botMove: ({ board }, seat) =>
    winningCellFor(board, seat) ??
    winningCellFor(board, 1 - seat) ??
    (board[CENTRE] === null ? CENTRE : null) ??
    anyOf(CORNERS.filter((cell) => board[cell] === null)) ??
    anyOf(emptyCellsOf(board)),
  // nothing is hidden, so everyone sees the whole board; only the player to move gets moves to make
  viewFor: (state, seat) => ({
    ...state,
    line: winningLineOf(state.board),
    legalMoves: seat === state.turn && !outcome(state) ? emptyCellsOf(state.board) : [],
  }),
};

export default ticTacToe;
