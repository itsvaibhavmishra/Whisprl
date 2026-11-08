import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove, DISTRACTED, momentFor } from "#src/services/games/dots-and-boxes/bot.js";
import { linesIn, openLinesOf, outcome, play, scoresOf, setup, sidesOfBox } from "#src/services/games/dots-and-boxes/rules.js";
import { withSeed } from "#src/services/games/withSeed.js";

const board = (size, players = 2) => setup(null, { size, players });

// a grid the lobby does not offer, built by hand, so a position stays small enough to read
const SMALL = { width: 3, height: 3, players: 2, lines: Array(linesIn({ width: 3, height: 3 })).fill(null), boxes: Array(9).fill(null), turn: 0, first: 0 };

const draw = (state, ...lines) => lines.reduce((current, line) => play(current, current.turn, line), state);

// every move here gives boxes away, and they are not worth the same: the cheapest hands over one
const FORCED = [0, 1, 2, 4, 6, 10, 11, 12, 15, 17, 19, 21, 23];
const CHEAPEST = [9, 20];

// only the roll deciding whether the bot looks away is fixed, so its pick among equal moves stays random
const withLuck = (roll, run) => {
  const real = Math.random;
  let spent = false;
  Math.random = () => {
    if (spent) return real();
    spent = true;
    return roll;
  };
  try {
    return run();
  } finally {
    Math.random = real;
  }
};

const PAYING_ATTENTION = 0.99;
const LOOKING_AWAY = 0;

const over200 = (make) => new Set(Array.from({ length: 200 }, make));

const everyChoiceOn = (state) => over200(() => withLuck(PAYING_ATTENTION, () => botMove(state)));

test("a box with three sides is taken", () => {
  const [top, bottom, left, right] = sidesOfBox(SMALL, 0);
  assert.deepEqual(everyChoiceOn(draw(SMALL, top, bottom, left)), new Set([right]));
});

test("no box is left on three sides while a line that gives nothing away is free", () => {
  const [top, , left] = sidesOfBox(SMALL, 0);
  const gifts = [sidesOfBox(SMALL, 0)[1], sidesOfBox(SMALL, 0)[3]];
  const chosen = everyChoiceOn(draw(SMALL, top, left));
  assert.ok(
    gifts.every((gift) => !chosen.has(gift)),
    `chose a gift from ${[...chosen]}`
  );
});

test("when every line gives something away, the smallest chain is opened", () => {
  const forced = draw(SMALL, ...FORCED);
  assert.deepEqual(
    [...everyChoiceOn(forced)].sort((one, other) => one - other),
    CHEAPEST
  );
});

test("two bots finish a game on every board offered, and every box ends up claimed", () => {
  for (const size of [4, 5, 6]) {
    let state = board(size);
    while (!outcome(state)) state = play(state, state.turn, botMove(state));
    assert.equal(openLinesOf(state).length, 0);
    assert.equal(
      scoresOf(state).reduce((total, score) => total + score, 0),
      state.boxes.length
    );
  }
});

test("a free box is taken even by a bot that is looking away", () => {
  const [top, bottom, left, right] = sidesOfBox(SMALL, 0);
  const state = draw(SMALL, top, bottom, left);
  assert.equal(
    withLuck(0, () => botMove(state)),
    right
  );
});

test("looking away, it sometimes hands a box over instead of playing safe", () => {
  const [top, , left] = sidesOfBox(SMALL, 0);
  const state = draw(SMALL, top, left);
  const gifts = [sidesOfBox(SMALL, 0)[1], sidesOfBox(SMALL, 0)[3]];
  const chosen = over200(() => withLuck(LOOKING_AWAY, () => botMove(state)));
  assert.ok(
    gifts.some((gift) => chosen.has(gift)),
    `never gave one away in 200 tries: ${[...chosen]}`
  );
});

test("the bot standing in for someone who left is the weaker of the two", () => {
  assert.ok(DISTRACTED.standIn > DISTRACTED.medium);
});

// the top row is a chain of three and the two rows below one snaking chain of six, so every line left gives something away
const TWO_CHAINS = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 19, 23];

test("handed a short chain while a long one waits, the expert takes all but the last two boxes and hands those back", () => {
  // the short chain was opened at its end and the expert has taken its first box, leaving two
  const state = draw(SMALL, ...TWO_CHAINS, 12, 13);
  assert.equal(botMove(state, state.turn, "expert"), 15);
  assert.equal(
    withLuck(PAYING_ATTENTION, () => botMove(state, state.turn, "medium")),
    14
  );
});

test("with nothing left to fight over, the expert takes every box", () => {
  const lastChain = draw(SMALL, ...TWO_CHAINS, 16, 17, 18, 8, 22, 21, 20, 12, 13);
  assert.equal(botMove(lastChain, lastChain.turn, "expert"), 14);
});

const playedOut = (levels, first) => {
  let state = { ...board(4), turn: first, first };
  while (!outcome(state)) state = play(state, state.turn, botMove(state, state.turn, levels[state.turn]));
  return outcome(state).winners;
};

const record = (games, levels) => {
  const results = Array.from({ length: games }, (_, game) => playedOut(levels, game % 2));
  return { won: results.filter((winners) => winners[0] === 0).length, lost: results.filter((winners) => winners[0] === 1).length };
};

test("a medium bot beats a dumb one far more often than not, and the expert beats a medium bot and a pro more often than not", () => {
  [
    ["medium", "dumb", 2],
    ["expert", "medium", 1],
    ["expert", "pro", 1],
  ].forEach(([mine, theirs, times]) => {
    const { won, lost } = withSeed(1, () => record(200, [mine, theirs]));
    assert.ok(won > lost * times, `${mine} won ${won} and lost ${lost} against ${theirs}`);
  });
});

test("a bot reacts when it takes a box, and when one is taken from it", () => {
  const [top, bottom, left, right] = sidesOfBox(SMALL, 0);
  const before = draw(SMALL, top, bottom, left);
  const after = play(before, before.turn, right);
  assert.equal(momentFor(before, after, before.turn), "took");
  assert.equal(momentFor(before, after, 1 - before.turn), "gaveAway");
});
