import { boxesClosedBy, boxesTouching, openLinesOf, sidesDrawnOn, sidesOfBox } from "#src/services/games/dots-and-boxes/rules.js";

const anyOf = (lines) => lines[Math.floor(Math.random() * lines.length)];

// a line is a gift when it leaves a box on three sides, one move from being taken
const isSafe = (state, line) => boxesTouching(state, line).every((box) => sidesDrawnOn(state, box) < 2);

const closingLineOn = (grid, lines) => openLinesOf({ lines }).find((line) => boxesClosedBy({ ...grid, lines }, line).length);

// the lines once the next player has taken every box this line hands them, and how many boxes that was
const handedOver = (state, line) => {
  let lines = state.lines.map((drawnBy, at) => (at === line ? 0 : drawnBy));
  let taken = 0;
  let closing = closingLineOn(state, lines);
  while (closing !== undefined) {
    taken += boxesClosedBy({ ...state, lines }, closing).length;
    lines = lines.map((drawnBy, at) => (at === closing ? 0 : drawnBy));
    closing = closingLineOn(state, lines);
  }
  return { taken, after: { ...state, lines } };
};

const opensHowMany = (state, line) => handedOver(state, line).taken;

const openingTheLeast = (state, lines) => {
  const costs = lines.map((line) => ({ line, opened: opensHowMany(state, line) }));
  const least = Math.min(...costs.map(({ opened }) => opened));
  return anyOf(costs.filter(({ opened }) => opened === least).map(({ line }) => line));
};

// how often each level gives a box away instead of playing safe, tuned by simulating games against it
export const DISTRACTED = { dumb: 0.6, medium: 0.12, pro: 0.03, standIn: 0.3 };

const drawn = (state, lines) => ({ ...state, lines: state.lines.map((drawnBy, at) => (lines.includes(at) ? 0 : drawnBy)) });

const openSidesOf = (state, box) => sidesOfBox(state, box).filter((side) => state.lines[side] === null);

const isUnclaimed = (state, box) => openSidesOf(state, box).length > 0;

// the boxes still unclaimed, joined wherever they share an undrawn side; once every line gives something away these are chains and loops
const regionsOf = (state) => {
  const seen = new Set();
  return state.boxes.flatMap((_, start) => {
    if (!isUnclaimed(state, start) || seen.has(start)) return [];
    const boxes = [];
    const waiting = [start];
    seen.add(start);
    while (waiting.length) {
      const box = waiting.pop();
      boxes.push(box);
      openSidesOf(state, box)
        .flatMap((side) => boxesTouching(state, side))
        .filter((next) => isUnclaimed(state, next) && !seen.has(next))
        .forEach((next) => {
          seen.add(next);
          waiting.push(next);
        });
    }
    const isLoop = boxes.every((box) => openSidesOf(state, box).every((side) => boxesTouching(state, side).every((next) => boxes.includes(next))));
    return [{ boxes, isLoop }];
  });
};

const solvedEndgames = new Map();
const LONG_CHAIN = 3;

const withoutAt = (items, at) => items.filter((_, other) => other !== at);

// whoever is handed boxes takes them all, or all but the last two (four of a loop) to make the giver open the next region
const takerValue = (size, isLoop, valueAfter) => {
  const keptBack = isLoop ? 4 : 2;
  const takeAll = size + valueAfter;
  return size > keptBack ? Math.max(takeAll, size - 2 * keptBack - valueAfter) : takeAll;
};

// what the player who must open a region can force from here, over regions described only by size and shape
const endgameValue = (regions) => {
  if (!regions.length) return 0;
  const key = regions
    .map(({ size, isLoop }) => `${isLoop ? "l" : "c"}${size}`)
    .sort()
    .join();
  if (!solvedEndgames.has(key)) {
    solvedEndgames.set(key, Math.max(...regions.map(({ size, isLoop }, at) => -takerValue(size, isLoop, endgameValue(withoutAt(regions, at))))));
  }
  return solvedEndgames.get(key);
};

const shapesOf = (regions) => regions.map(({ boxes, isLoop }) => ({ size: boxes.length, isLoop }));

// a line inside a two-box chain gives both boxes at once, so the taker cannot hand them back
const isMiddleOfPair = (state, line) => {
  const touching = boxesTouching(state, line);
  return touching.length === 2 && touching.every((box) => isUnclaimed(state, box) && sidesDrawnOn(state, box) === 2);
};

// every line gives something away, so each is weighed by what it hands over and what is left to fight over after
const lineToGive = (state, open) => {
  const scored = open.map((line) => {
    const { taken, after } = handedOver(state, line);
    return { line, value: -takerValue(taken, false, endgameValue(shapesOf(regionsOf(after)))) };
  });
  const best = Math.max(...scored.map(({ value }) => value));
  const chosen = scored.filter(({ value }) => value === best).map(({ line }) => line);
  return chosen.find((line) => isMiddleOfPair(state, line)) ?? anyOf(chosen);
};

// drawing a line beside a box already on two sides would hand that box over too
const givesMore = (state, line, besides) =>
  boxesTouching(state, line).some((box) => box !== besides && isUnclaimed(state, box) && sidesDrawnOn(state, box) >= 2);

// with two boxes left to take at the end of a chain, drawing their far side hands both over and keeps control, worth it while a long chain is still to come
const doubleCross = (state, closing) => {
  if (closing.length !== 1) return null;
  const [taken] = boxesClosedBy(state, closing[0]);
  const next = boxesTouching(state, closing[0]).find((box) => box !== taken && isUnclaimed(state, box));
  if (next === undefined || sidesDrawnOn(state, next) !== 2) return null;
  const farSide = openSidesOf(state, next).find((side) => side !== closing[0]);
  if (farSide === undefined || givesMore(state, farSide, next)) return null;
  return regionsOf(drawn(state, [closing[0], farSide])).some(({ boxes }) => boxes.length >= LONG_CHAIN) ? farSide : null;
};

// a counting player: it plays safe while it can, then opens the regions in the order that pays and keeps control with the double cross
const expertMove = (state) => {
  const open = openLinesOf(state);
  const closing = open.filter((line) => boxesClosedBy(state, line).length);
  const safe = open.filter((line) => isSafe(state, line));
  if (closing.length) return (safe.length ? null : doubleCross(state, closing)) ?? anyOf(closing);
  if (safe.length) return anyOf(safe);
  return lineToGive(state, open);
};

// an ordinary player never plays the double cross, so anyone who counts chains can beat it
export const botMove = (state, seat, level = "medium") => {
  if (level === "expert") return expertMove(state);
  const open = openLinesOf(state);
  const closing = open.filter((line) => boxesClosedBy(state, line).length);
  // a free box is always taken, because leaving one on the board looks broken rather than kind
  if (closing.length) return anyOf(closing);
  if (Math.random() < DISTRACTED[level]) return anyOf(open);
  const safe = open.filter((line) => isSafe(state, line));
  if (safe.length) return anyOf(safe);
  return openingTheLeast(state, open);
};

export const BOT_MOODS = { took: "proud", gaveAway: "hurt" };

export const momentFor = (before, after, seat) => {
  const closer = after.boxes.find((owner, box) => owner !== null && before.boxes[box] === null);
  if (closer === undefined) return null;
  return closer === seat ? "took" : "gaveAway";
};
