import { nextStep, pillOf } from "@/sections/chat/game/games/jackaroo/choices";

const marble = (owner, id) => ({ owner, id });
const track = (index) => ({ at: "track", index });
const move = (who, to, steps, extra = {}) => ({ marble: who, to, steps, knocksOut: false, home: false, ...extra });

const OPTIONS = [
  { key: "ace-out", card: "ace", kind: "out", moves: [move(marble(0, 1), track(0), 1)] },
  { key: "ace-move", card: "ace", kind: "move", moves: [move(marble(0, 0), track(6), 1)] },
  { key: "seven", card: "seven", kind: "move", moves: [move(marble(0, 0), track(12), 7)] },
  { key: "seven-other", card: "seven", kind: "move", moves: [move(marble(0, 2), track(27), 7)] },
  { key: "seven-3-4", card: "seven", kind: "split", moves: [move(marble(0, 0), track(8), 3), move(marble(0, 2), track(24), 4, { knocksOut: true })] },
  { key: "seven-3-4-other", card: "seven", kind: "split", moves: [move(marble(0, 0), track(8), 3), move(marble(0, 3), track(34), 4)] },
  { key: "ten-throw", card: "ten", kind: "discardOther", moves: null },
  { key: "ten-move", card: "ten", kind: "move", moves: [move(marble(0, 0), track(15), 10)] },
  { key: "three-home", card: "three", kind: "move", moves: [move(marble(0, 0), { at: "home", slot: 1 }, 3, { home: true })] },
];

test("a card that can do two different things asks which first", () => {
  expect(nextStep(OPTIONS, { card: "ace" }).actions).toEqual(["move", "new"]);
  expect(nextStep(OPTIONS, { card: "ten" }).actions).toEqual(["move", "discard"]);
  expect(nextStep(OPTIONS, { card: "ten", action: "discard" }).play.key).toBe("ten-throw");
});

test("a card with only one play left sends it without asking", () => {
  expect(nextStep(OPTIONS, { card: "ace", action: "move" }).play.key).toBe("ace-move");
  expect(nextStep(OPTIONS, { card: "three" }).play.key).toBe("three-home");
});

test("a seven asks for the marble, then the steps, then the marble for the rest", () => {
  expect(nextStep(OPTIONS, { card: "seven" }).marbles).toEqual([marble(0, 0), marble(0, 2), marble(0, 3)]);
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 0) }).steps).toEqual([3, 7]);
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 0), steps: 7 }).play.key).toBe("seven");
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 0), steps: 3 }).seconds).toEqual([marble(0, 2), marble(0, 3)]);
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 0), steps: 3, second: marble(0, 3) }).play.key).toBe("seven-3-4-other");
});

test("a seven split may start from either marble, so a marble behind another can take the steps that end where the other stood", () => {
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 3) }).steps).toEqual([4]);
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 3), steps: 4 }).play.key).toBe("seven-3-4-other");
  expect(nextStep(OPTIONS, { card: "seven", marble: marble(0, 2) }).steps).toEqual([4, 7]);
});

test("a seven with one split left still asks its steps, so the player sees how the seven is shared", () => {
  const options = [
    { key: "last-home", card: "seven", kind: "split", moves: [move(marble(0, 0), { at: "home", slot: 0 }, 3), move(marble(2, 0), track(44), 4)] },
  ];
  expect(nextStep(options, { card: "seven" }).marbles).toEqual([marble(0, 0), marble(2, 0)]);
  expect(nextStep(options, { card: "seven", marble: marble(0, 0) }).steps).toEqual([3]);
  expect(nextStep(options, { card: "seven", marble: marble(0, 0), steps: 3 }).play.key).toBe("last-home");
});

test("a jack asks for your marble and then theirs, even when each has only one answer", () => {
  const options = [{ key: "swap", card: "jack", kind: "swap", moves: null, swap: [marble(0, 0), marble(1, 2)] }];
  expect(nextStep(options, { card: "jack" }).marbles).toEqual([marble(0, 0)]);
  expect(nextStep(options, { card: "jack", marble: marble(0, 0) }).seconds).toEqual([marble(1, 2)]);
  expect(nextStep(options, { card: "jack", marble: marble(0, 0), second: marble(1, 2) }).play.key).toBe("swap");
});

test("a card's pill says when one of its plays knocks out a rival or takes a marble home", () => {
  expect(pillOf(OPTIONS, "seven")).toBe("Kill");
  expect(pillOf(OPTIONS, "three")).toBe("Finish");
  expect(pillOf(OPTIONS, "ace")).toBeNull();
});
