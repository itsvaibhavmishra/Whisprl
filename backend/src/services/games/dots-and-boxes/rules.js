import createHttpError from "http-errors";

import { coloursFor } from "#src/services/games/colours.js";

// boxes a side: a quick game, one with room for chains, and one with room for several players
export const SIZES = [3, 4, 5];

const STANDARD = 4;
// fewer than this and a player has nothing to play for, which is what caps the seats a board holds
const BOXES_EACH = 4;

export const linesIn = (size) => 2 * size * (size + 1);

export const boxesIn = (size) => size * size;

export const mostPlayersOn = (size) => Math.floor(boxesIn(size) / BOXES_EACH);

// lines are numbered across first then down, so a box's four sides are arithmetic rather than a lookup
const acrossAt = (size, row, col) => row * size + col;

const downAt = (size, row, col) => (size + 1) * size + row * (size + 1) + col;

export const sidesOfBox = (size, box) => {
  const row = Math.floor(box / size);
  const col = box % size;
  return [acrossAt(size, row, col), acrossAt(size, row + 1, col), downAt(size, row, col), downAt(size, row, col + 1)];
};

export const boxesTouching = (size, line) => Array.from({ length: boxesIn(size) }, (_, box) => box).filter((box) => sidesOfBox(size, box).includes(line));

export const openLinesOf = ({ lines }) => lines.flatMap((drawnBy, line) => (drawnBy === null ? [line] : []));

export const sidesDrawnOn = ({ size, lines }, box) => sidesOfBox(size, box).filter((side) => lines[side] !== null).length;

// read before the line is drawn, so it asks whether every other side is already there
export const boxesClosedBy = ({ size, lines }, line) =>
  boxesTouching(size, line).filter((box) => sidesOfBox(size, box).every((side) => side === line || lines[side] !== null));

export const scoresOf = ({ boxes, players }) => Array.from({ length: players }, (_, seat) => boxes.filter((owner) => owner === seat).length);

// the engine merges the seat count in as players, so the board and the table are checked together
export const assertOptions = ({ size, players }) => {
  if (!SIZES.includes(size)) throw createHttpError.BadRequest("That board size does not exist");
  if (players < 2 || players > mostPlayersOn(size)) {
    throw createHttpError.BadRequest(`A ${size} by ${size} board seats at most ${mostPlayersOn(size)} players`);
  }
};

export const DEFAULTS = { size: STANDARD };

export const setup = (previous, { size = STANDARD, players = 2, seating = null } = {}) => {
  assertOptions({ size, players });
  // whoever opened the last game does not open this one
  const first = previous ? (previous.first + 1) % players : 0;
  return {
    size,
    players,
    seating,
    colours: coloursFor(previous, players, seating),
    lines: Array(linesIn(size)).fill(null),
    boxes: Array(boxesIn(size)).fill(null),
    turn: first,
    first,
  };
};

export const turnOf = (state) => state.turn;

export const play = (state, seat, line) => {
  if (!Number.isInteger(line) || line < 0 || line >= state.lines.length) throw createHttpError.BadRequest("That line does not exist");
  if (state.lines[line] !== null) throw createHttpError.BadRequest("That line is already drawn");
  const closed = boxesClosedBy(state, line);
  const lines = state.lines.map((drawnBy, at) => (at === line ? seat : drawnBy));
  const boxes = closed.length ? state.boxes.map((owner, box) => (closed.includes(box) ? seat : owner)) : state.boxes;
  // closing a box earns another move, so the turn passes only when a line closes nothing
  return { ...state, lines, boxes, turn: closed.length ? seat : (seat + 1) % state.players };
};

export const outcome = (state) => {
  if (state.lines.some((drawnBy) => drawnBy === null)) return null;
  const scores = scoresOf(state);
  const most = Math.max(...scores);
  const leaders = scores.flatMap((score, seat) => (score === most ? [seat] : []));
  // several level at the top means nobody holds the most, which is this engine's draw
  return { winners: leaders.length === 1 ? leaders : [] };
};

// nothing is hidden, so everyone sees the whole board; only the player to move gets moves to make
export const viewFor = (state, seat) => ({
  ...state,
  scores: scoresOf(state),
  legalMoves: seat === state.turn && !outcome(state) ? openLinesOf(state) : [],
});
