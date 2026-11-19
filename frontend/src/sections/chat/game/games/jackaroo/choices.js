// Once a card is played, what is left to choose is asked one question at a time, until one of the server's plays remains.

const sameMarble = (one, two) => Boolean(one && two) && one.owner === two.owner && one.id === two.id;

// each order a play's choices can be made in: a split starts from either of its marbles, the other then taking the rest of the seven
const readingsOf = (option) => {
  if (option.swap) return [{ marble: option.swap[0], steps: null, second: option.swap[1] }];
  const [first, second] = option.moves ?? [];
  if (!first) return [{ marble: null, steps: null, second: null }];
  const lead = { marble: first.marble, steps: first.steps, second: second?.marble ?? null };
  return second ? [lead, { marble: second.marble, steps: second.steps, second: first.marble }] : [lead];
};

const fits = (reading, { marble, steps, second }) =>
  (!marble || sameMarble(reading.marble, marble)) && (!steps || reading.steps === steps) && (!second || sameMarble(reading.second, second));

// a king, an ace or a two can place a new marble instead of moving one, and a ten can make the other player discard
const actionOf = (option) => {
  if (option.kind === "out") return "new";
  return option.kind === "discardOther" ? "discard" : "move";
};

// the reference game offers the move first, then placing a new marble or making them discard
const ACTION_ORDER = ["move", "new", "discard"];

// plays that only throw cards away
export const THROWS = ["discard", "discardAll", "lose"];

const uniqueMarbles = (marbles) => marbles.filter((marble, index) => marble && marbles.findIndex((other) => sameMarble(other, marble)) === index);

export const narrowed = (options, chosen) =>
  options.filter(
    (option) =>
      (!chosen.card || option.card === chosen.card) &&
      (!chosen.action || actionOf(option) === chosen.action) &&
      readingsOf(option).some((reading) => fits(reading, chosen))
  );

// a swap always has both its marbles picked and a split its steps, even when only one answer is left, so the player sees what the card does
const isAsked = (answers, left, kinds) => answers.length > 1 || (answers.length === 1 && left.some((option) => kinds.includes(option.kind)));

// the next question for a played card, or the one play left to send
export const nextStep = (options, chosen) => {
  const left = narrowed(options, chosen);
  const readings = left.flatMap((option) => readingsOf(option).filter((reading) => fits(reading, chosen)));
  const actions = ACTION_ORDER.filter((action) => left.some((option) => actionOf(option) === action));
  if (!chosen.action && actions.length > 1) return { actions };
  const marbles = uniqueMarbles(readings.map((reading) => reading.marble));
  if (!chosen.marble && isAsked(marbles, left, ["swap"])) return { marbles };
  const steps = [...new Set(readings.map((reading) => reading.steps).filter(Boolean))].sort((one, two) => one - two);
  if (!chosen.steps && isAsked(steps, left, ["split"])) return { steps };
  const seconds = uniqueMarbles(readings.map((reading) => reading.second));
  if (!chosen.second && isAsked(seconds, left, ["swap"])) return { seconds };
  return { play: left[0] };
};

// a card whose plays could knock out a rival or take a marble home says so on a pill, which is how the hand reads at a glance
export const pillOf = (options, card) => {
  const moves = narrowed(options, { card }).flatMap((option) => option.moves ?? []);
  if (moves.some((move) => move.knocksOut)) return "Kill";
  return moves.some((move) => move.home) ? "Finish" : null;
};
