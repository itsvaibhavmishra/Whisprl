import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove, DISTRACTED, momentFor } from "#src/services/games/tic-tac-toe/bot.js";
import { outcome, play, setup, turnOf } from "#src/services/games/tic-tac-toe/rules.js";
import { withSeed } from "#src/services/games/withSeed.js";

const CROSS = 0;
const NOUGHT = 1;
const BLANK = null;

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

test("a free win is taken even by a bot that is looking away", () => {
  const board = [NOUGHT, NOUGHT, BLANK, CROSS, CROSS, BLANK, CROSS, BLANK, BLANK];
  assert.equal(
    withLuck(LOOKING_AWAY, () => botMove({ board }, NOUGHT)),
    2
  );
  assert.equal(
    withLuck(PAYING_ATTENTION, () => botMove({ board }, NOUGHT)),
    2
  );
});

test("a line it cannot win is blocked, while it is paying attention", () => {
  const board = [CROSS, CROSS, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK];
  assert.deepEqual(
    over200(() => withLuck(PAYING_ATTENTION, () => botMove({ board }, NOUGHT))),
    new Set([2])
  );
});

test("looking away, it does not always find that block", () => {
  const board = [CROSS, CROSS, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK];
  const chosen = over200(() => withLuck(LOOKING_AWAY, () => botMove({ board }, NOUGHT)));
  assert.ok(chosen.size > 1, `a bot looking away always played ${[...chosen]}`);
});

test("it opens in the centre, and takes the last square when that is all there is", () => {
  assert.equal(
    withLuck(PAYING_ATTENTION, () => botMove(setup(), CROSS)),
    4
  );
  const board = [CROSS, NOUGHT, CROSS, CROSS, NOUGHT, NOUGHT, NOUGHT, CROSS, BLANK];
  assert.equal(
    withLuck(LOOKING_AWAY, () => botMove({ board }, CROSS)),
    8
  );
});

test("the bot standing in for someone who left is weaker than a medium one, and each level looks away less than the one below", () => {
  assert.ok(DISTRACTED.standIn > DISTRACTED.medium);
  assert.ok(DISTRACTED.dumb > DISTRACTED.medium && DISTRACTED.medium > DISTRACTED.pro);
});

const playedOut = (levels, first = 0) => {
  let state = { ...setup(), turn: first, first };
  while (!outcome(state)) {
    const seat = turnOf(state);
    state = play(state, seat, botMove(state, seat, levels[seat]));
  }
  return outcome(state).winners;
};

test("an expert loses only now and then, whoever it plays and whoever opens, so it can be beaten but rarely is", () => {
  withSeed(3, () => {
    ["dumb", "medium", "pro", "expert"].forEach((rival) => {
      const lost = Array.from({ length: 200 }, (_, game) => playedOut(["expert", rival], game % 2)).filter((winners) => winners.includes(1)).length;
      assert.ok(lost < 200 * 0.1, `the expert lost ${lost} of 200 to ${rival}`);
    });
  });
});

test("two experts nearly always draw", () => {
  const drawn = withSeed(
    4,
    () => Array.from({ length: 200 }, (_, game) => playedOut(["expert", "expert"], game % 2)).filter((winners) => !winners.length).length
  );
  assert.ok(drawn > 200 * 0.85, `only ${drawn} of 200 were drawn`);
});

test("a medium bot beats a dumb one far more often than it loses to it", () => {
  const results = withSeed(1, () => Array.from({ length: 400 }, (_, game) => playedOut(["medium", "dumb"], game % 2)));
  const won = results.filter((winners) => winners[0] === 0).length;
  const lost = results.filter((winners) => winners[0] === 1).length;
  assert.ok(won > lost * 2, `medium won ${won} and lost ${lost}`);
});

test("a bot reacts when it is about to lose a line, and when it blocks one", () => {
  const before = { board: [CROSS, BLANK, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK], turn: CROSS };
  const threatened = play(before, CROSS, 1);
  assert.equal(momentFor(before, threatened, NOUGHT), "threatened");
  assert.equal(momentFor(threatened, play(threatened, NOUGHT, 2), NOUGHT), "blocked");
});
