// Once a card is played, what is left to choose is asked one question at a time, until one of the server's plays remains.

const sameMarble = (one, two) => Boolean(one && two) && one.owner === two.owner && one.id === two.id;

// the marble a play starts with: the one that moves first, or the one of yours a swap gives away
const actorOf = (option) => option.moves?.[0]?.marble ?? option.swap?.[0] ?? null;
const secondOf = (option) => option.moves?.[1]?.marble ?? option.swap?.[1] ?? null;
const stepsOf = (option) => option.moves?.[0]?.steps ?? null;

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

export const narrowed = (options, { card, action, marble, steps, second }) =>
  options.filter(
    (option) =>
      (!card || option.card === card) &&
      (!action || actionOf(option) === action) &&
      (!marble || sameMarble(actorOf(option), marble)) &&
      (!steps || stepsOf(option) === steps) &&
      (!second || sameMarble(secondOf(option), second))
  );

// the next question for a played card, or the one play left to send
export const nextStep = (options, chosen) => {
  const left = narrowed(options, chosen);
  if (left.length === 1) return { play: left[0] };
  const actions = ACTION_ORDER.filter((action) => left.some((option) => actionOf(option) === action));
  if (!chosen.action && actions.length > 1) return { actions };
  const marbles = uniqueMarbles(left.map(actorOf));
  if (!chosen.marble && marbles.length > 1) return { marbles };
  const steps = [...new Set(left.map(stepsOf))].sort((one, two) => one - two);
  if (!chosen.steps && steps.length > 1) return { steps };
  const seconds = uniqueMarbles(left.map(secondOf));
  if (!chosen.second && seconds.length > 1) return { seconds };
  return { play: left[0] };
};

// a card whose plays could knock out a rival or take a marble home says so on a pill, which is how the hand reads at a glance
export const pillOf = (options, card) => {
  const moves = narrowed(options, { card }).flatMap((option) => option.moves ?? []);
  if (moves.some((move) => move.knocksOut)) return "Kill";
  return moves.some((move) => move.home) ? "Finish" : null;
};
