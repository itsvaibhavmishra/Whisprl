import { boxesClosedBy, boxesTouching, openLinesOf, sidesDrawnOn } from "#src/services/games/dots-and-boxes/rules.js";

const anyOf = (lines) => lines[Math.floor(Math.random() * lines.length)];

// a line is a gift when it leaves a box on three sides, one move from being taken
const isSafe = (state, line) => boxesTouching(state.size, line).every((box) => sidesDrawnOn(state, box) < 2);

const closingLineOn = (size, lines) => openLinesOf({ lines }).find((line) => boxesClosedBy({ size, lines }, line).length);

// how many boxes the next player walks off with, taking every one it can in turn
const opensHowMany = ({ size, lines }, line) => {
  let drawn = lines.map((drawnBy, at) => (at === line ? 0 : drawnBy));
  let taken = 0;
  let closing = closingLineOn(size, drawn);
  while (closing !== undefined) {
    taken += boxesClosedBy({ size, lines: drawn }, closing).length;
    drawn = drawn.map((drawnBy, at) => (at === closing ? 0 : drawnBy));
    closing = closingLineOn(size, drawn);
  }
  return taken;
};

const openingTheLeast = (state, lines) => {
  const costs = lines.map((line) => ({ line, opened: opensHowMany(state, line) }));
  const least = Math.min(...costs.map(({ opened }) => opened));
  return anyOf(costs.filter(({ opened }) => opened === least).map(({ line }) => line));
};

// how often it gives a box away instead of playing safe, tuned by simulating games against it
export const DISTRACTED = { opponent: 0.12, standIn: 0.3 };

// an ordinary player: it never plays the double cross, so anyone who counts chains can beat it
export const botMove = (state, seat, level = "opponent") => {
  const open = openLinesOf(state);
  const closing = open.filter((line) => boxesClosedBy(state, line).length);
  // a free box is always taken, because leaving one on the board looks broken rather than kind
  if (closing.length) return anyOf(closing);
  if (Math.random() < DISTRACTED[level]) return anyOf(open);
  const safe = open.filter((line) => isSafe(state, line));
  return safe.length ? anyOf(safe) : openingTheLeast(state, open);
};
