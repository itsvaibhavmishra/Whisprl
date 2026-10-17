import createHttpError from "http-errors";

import { coloursFor } from "#src/services/games/colours.js";

// taller than wide, because the panel is tall and narrow on a phone
export const SIZES = {
  quick: { width: 5, height: 7 },
  standard: { width: 6, height: 9 },
  long: { width: 7, height: 11 },
};

const STANDARD = "standard";
// a cascade that never settled would stall every game on this server, so it is cut off rather than trusted
const MOST_ROUNDS = 1000;
// fewer than this and players start on top of each other, which is what caps the seats a board holds
const CELLS_EACH = 10;

export const cellsIn = ({ width, height }) => width * height;

export const mostPlayersOn = (size) => Math.floor(cellsIn(SIZES[size]) / CELLS_EACH);

export const neighboursOf = ({ width, height }, cell) => {
  const row = Math.floor(cell / width);
  const col = cell % width;
  const around = [];
  if (row > 0) around.push(cell - width);
  if (row < height - 1) around.push(cell + width);
  if (col > 0) around.push(cell - 1);
  if (col < width - 1) around.push(cell + 1);
  return around;
};

// a cell bursts on reaching its neighbour count: two in a corner, three on an edge, four inside
export const criticalMassOf = (grid, cell) => neighboursOf(grid, cell).length;

const fullCellsIn = (grid, orbs) => orbs.flatMap((count, cell) => (count >= criticalMassOf(grid, cell) ? [cell] : []));

export const orbsHeldBy = ({ owners, orbs }, seat) => owners.reduce((held, owner, cell) => (owner === seat ? held + orbs[cell] : held), 0);

// nobody holds anything before their first move, so only a seat that has played can be out
export const isOut = (state, seat) => state.played[seat] && orbsHeldBy(state, seat) === 0;

export const legalCellsFor = ({ owners }, seat) => owners.flatMap((owner, cell) => (owner === null || owner === seat ? [cell] : []));

const winnerOf = (state) => {
  if (!state.played.every(Boolean)) return null;
  const standing = state.played.flatMap((_, seat) => (orbsHeldBy(state, seat) > 0 ? [seat] : []));
  return standing.length === 1 ? standing[0] : null;
};

// the engine merges the seat count in as players, so the board and the table are checked together
export const assertOptions = ({ size, players }) => {
  if (!SIZES[size]) throw createHttpError.BadRequest("That board size does not exist");
  if (players < 2 || players > mostPlayersOn(size)) {
    throw createHttpError.BadRequest(`That board seats at most ${mostPlayersOn(size)} players`);
  }
};

export const DEFAULTS = { size: STANDARD };

export const setup = (previous, { size = STANDARD, players = 2, seating = null } = {}) => {
  assertOptions({ size, players });
  const { width, height } = SIZES[size];
  // whoever opened the last game does not open this one
  const first = previous ? (previous.first + 1) % players : 0;
  return {
    size,
    width,
    height,
    players,
    seating,
    colours: coloursFor(previous, players, seating),
    owners: Array(width * height).fill(null),
    orbs: Array(width * height).fill(0),
    played: Array(players).fill(false),
    turn: first,
    first,
    lastMove: null,
    bursts: [],
  };
};

export const turnOf = (state) => state.turn;

const nextTurnAfter = (state, seat) => {
  for (let step = 1; step <= state.players; step += 1) {
    const candidate = (seat + step) % state.players;
    if (!isOut(state, candidate)) return candidate;
  }
  return seat;
};

// every full cell bursts at once, round by round, so the client can replay the same rounds it was sent
const cascade = (state, seat) => {
  const owners = [...state.owners];
  const orbs = [...state.orbs];
  const bursts = [];
  let full = fullCellsIn(state, orbs);
  // once one colour is all that is left the board can burst forever, and the game is already won
  while (full.length && bursts.length < MOST_ROUNDS && winnerOf({ ...state, owners, orbs }) === null) {
    bursts.push(full);
    full.forEach((cell) => {
      orbs[cell] -= criticalMassOf(state, cell);
      if (!orbs[cell]) owners[cell] = null;
      neighboursOf(state, cell).forEach((neighbour) => {
        orbs[neighbour] += 1;
        owners[neighbour] = seat;
      });
    });
    full = fullCellsIn(state, orbs);
  }
  return { owners, orbs, bursts };
};

export const play = (state, seat, cell) => {
  if (!Number.isInteger(cell) || cell < 0 || cell >= state.owners.length) throw createHttpError.BadRequest("That cell does not exist");
  if (state.owners[cell] !== null && state.owners[cell] !== seat) throw createHttpError.BadRequest("That cell belongs to someone else");
  const placed = {
    ...state,
    owners: state.owners.map((owner, at) => (at === cell ? seat : owner)),
    orbs: state.orbs.map((count, at) => (at === cell ? count + 1 : count)),
    played: state.played.map((hasPlayed, at) => hasPlayed || at === seat),
  };
  const settled = { ...placed, ...cascade(placed, seat), lastMove: { seat, cell } };
  return { ...settled, turn: nextTurnAfter(settled, seat) };
};

export const outcome = (state) => {
  const winner = winnerOf(state);
  // orbs are only ever added, so somebody always holds them and the game cannot be drawn
  return winner === null ? null : { winners: [winner] };
};

// nothing is hidden, so everyone sees the whole board; only the player to move gets moves to make
export const viewFor = (state, seat) => ({
  ...state,
  out: state.played.map((_, at) => isOut(state, at)),
  legalMoves: seat === state.turn && !outcome(state) ? legalCellsFor(state, seat) : [],
});
