import createHttpError from "http-errors";

import { coloursFor } from "#src/services/games/colours.js";

// boxes across and down, keyed by the lobby's choice; the longest stands taller than wide, to fill a phone held upright
export const SIZES = { 4: { width: 4, height: 4 }, 5: { width: 5, height: 5 }, 6: { width: 6, height: 8 } };

const STANDARD = 4;
// fewer than this and a player has nothing to play for, which is what caps the seats a board holds
const BOXES_EACH = 4;

export const linesIn = ({ width, height }) => (height + 1) * width + height * (width + 1);

export const boxesIn = ({ width, height }) => width * height;

const isOffered = (size) => Object.hasOwn(SIZES, size);

export const mostPlayersOn = (size) => Math.floor(boxesIn(SIZES[size]) / BOXES_EACH);

// lines are numbered across first then down, so a box's four sides are arithmetic rather than a lookup
const acrossAt = ({ width }, row, col) => row * width + col;

const downAt = ({ width, height }, row, col) => (height + 1) * width + row * (width + 1) + col;

export const sidesOfBox = (grid, box) => {
  const row = Math.floor(box / grid.width);
  const col = box % grid.width;
  return [acrossAt(grid, row, col), acrossAt(grid, row + 1, col), downAt(grid, row, col), downAt(grid, row, col + 1)];
};

export const boxesTouching = (grid, line) => Array.from({ length: boxesIn(grid) }, (_, box) => box).filter((box) => sidesOfBox(grid, box).includes(line));

export const openLinesOf = ({ lines }) => lines.flatMap((drawnBy, line) => (drawnBy === null ? [line] : []));

export const sidesDrawnOn = (state, box) => sidesOfBox(state, box).filter((side) => state.lines[side] !== null).length;

// read before the line is drawn, so it asks whether every other side is already there
export const boxesClosedBy = (state, line) =>
  boxesTouching(state, line).filter((box) => sidesOfBox(state, box).every((side) => side === line || state.lines[side] !== null));

export const scoresOf = ({ boxes, players }) => Array.from({ length: players }, (_, seat) => boxes.filter((owner) => owner === seat).length);

// the engine merges the seat count in as players, so the board and the table are checked together
export const assertOptions = ({ size, players }) => {
  if (!isOffered(size)) throw createHttpError.BadRequest("That board size does not exist");
  if (players < 2 || players > mostPlayersOn(size)) {
    const { width, height } = SIZES[size];
    throw createHttpError.BadRequest(`A ${width} by ${height} board seats at most ${mostPlayersOn(size)} players`);
  }
};

export const DEFAULTS = { size: STANDARD };

export const setup = (previous, { size = STANDARD, players = 2, seating = null } = {}) => {
  // a lobby still set to a size no longer offered starts on the standard board
  const offered = isOffered(size) ? size : STANDARD;
  assertOptions({ size: offered, players });
  const grid = SIZES[offered];
  // whoever opened the last game does not open this one
  const first = previous ? (previous.first + 1) % players : 0;
  return {
    ...grid,
    players,
    seating,
    colours: coloursFor(previous, players, seating),
    lines: Array(linesIn(grid)).fill(null),
    boxes: Array(boxesIn(grid)).fill(null),
    lastLine: null,
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
  return { ...state, lines, boxes, lastLine: line, turn: closed.length ? seat : (seat + 1) % state.players };
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
