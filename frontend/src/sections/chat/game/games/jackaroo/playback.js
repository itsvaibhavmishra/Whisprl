// Plays a move out after React has drawn where everything ends up, animating each piece back from where it was on transform and opacity.
import art from "@/sections/chat/game/games/jackaroo/art";
import { CARD_RATIO } from "@/sections/chat/game/games/jackaroo/CardFace";
import { faceOf } from "@/sections/chat/game/games/jackaroo/cards";
import { THROWS } from "@/sections/chat/game/games/jackaroo/choices";
import { awesome, dust, glitter, goldBurst, goldWord, removedWhenDone, shake, spawn } from "@/sections/chat/game/games/jackaroo/effects";
import { marbleKey, pointOf } from "@/sections/chat/game/games/jackaroo/geometry";
import { UNDIMMED } from "@/sections/chat/game/games/jackaroo/Hand";
import layout from "@/sections/chat/game/games/jackaroo/layout.json";
import { SOUNDS } from "@/sections/chat/game/games/jackaroo/sounds";

// the server's jackaroo/pace.js starts the next clock once these have played out, so the two keep the same numbers
const CARD_MS = 300;
const MARBLE_AFTER_CARD_MS = 200;
const HOP_MS = 170;
const BRING_OUT_MS = 600;
const SWIRL_PAUSE_MS = 600;
const SWIRL_GLIDE_MS = 800;
const SWEEP_PAUSE_MS = 200;
const KNOCKOUT_MS = 400;
const SWAP_MS = 1100;
const TAKEN_MS = 1200;
// a card the red queen takes is held this much larger in the middle, the size it was picked at
const HELD = 1.4;
const BACK_MS = 420;
const GROW_MS = 560;
const BEAT_MS = 1200;
// a deal, timed from its start: the deck shows, a card leaves it every gap, alternating from the leader, and the deck goes
export const DEAL = { firstCardAt: 300, cardGap: 75, flight: 380, deckGoesAt: 1700 };
// a bonus card turns up a moment after its play has shown, then flies to whoever earned it
export const BONUS = { appearsAfter: 700, flight: 650 };
const FLIP_MS = 440;
// a marble in its home is drawn a little smaller, so four of them sit neatly in the lane
export const HOME_SIZE = 0.84;
// a card turning over is seen in depth, edge on halfway, so it reads as a card and not a shape squashed flat
const turnedTo = (degrees, lift = 0) => `perspective(800px) translateY(${-lift}px) rotateY(${degrees}deg) scale(${1 + lift / 80})`;

const offset = (from, to, scale) => `translate(${(from.x - to.x) * scale}px, ${(from.y - to.y) * scale}px)`;

// draws an element lying on the second rect over the first, as offset does with points on the board
const shiftBetween = (from, to) =>
  `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px)`;

const placesOf = (move) => [move.from, ...move.path];

const hopMsOf = (move) => (move.from.at === "base" ? BRING_OUT_MS : HOP_MS);

// when the marble reaches each hole of its path, pausing on each marble a king's sweep takes on the way
const arrivalsOf = (move) => {
  const hopMs = hopMsOf(move);
  const sweptAt = new Set(move.captured.filter(({ step }) => step < move.path.length).map(({ step }) => step));
  const arrivals = [0];
  move.path.forEach((_, index) => arrivals.push(arrivals[index] + hopMs + (sweptAt.has(index) ? SWEEP_PAUSE_MS : 0)));
  return arrivals;
};

const durationOf = (move) => arrivalsOf(move).at(-1) + (move.teleport ? SWIRL_PAUSE_MS + SWIRL_GLIDE_MS : 0);

const landsOnMarble = (move) => move.captured.some(({ step }) => step >= move.path.length);

// how long a whole play takes on the board, the same as the server counts it; a split's two marbles move together
export const lengthOf = (lastPlay) => {
  if (lastPlay.moves?.length)
    return CARD_MS + MARBLE_AFTER_CARD_MS + Math.max(...lastPlay.moves.map((move) => durationOf(move) + (landsOnMarble(move) ? KNOCKOUT_MS : 0)));
  if (lastPlay.swap) return CARD_MS + SWAP_MS;
  return lastPlay.kind === "takeCard" ? CARD_MS + TAKEN_MS : CARD_MS;
};

// when a round's deal starts, counted from when its state arrived: a game opens with one, and a round's last play is followed by one
export const dealStartOf = (lastPlay) => {
  if (!lastPlay) return 0;
  return lastPlay.dealt ? lengthOf(lastPlay) + BEAT_MS : null;
};

// a marble floating along a curve that bows sideways by bend, toward the middle of the loop (negative bends away), swelling at its height
const floatFrames = (from, to, final, scale, { startsAt, duration, total, bend = 0.3, swell = 0.6 }) => {
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const side = { x: from.y - to.y, y: to.x - from.x };
  const inward = Math.sign(side.x * (layout.pile.x - middle.x) + side.y * (layout.pile.y - middle.y)) || 1;
  const control = { x: middle.x + side.x * bend * inward, y: middle.y + side.y * bend * inward };
  return [0.25, 0.5, 0.75].map((share) => {
    const point = {
      x: (1 - share) ** 2 * from.x + 2 * (1 - share) * share * control.x + share ** 2 * to.x,
      y: (1 - share) ** 2 * from.y + 2 * (1 - share) * share * control.y + share ** 2 * to.y,
    };
    return {
      transform: `${offset(point, final, scale)} scale(${1 + swell * Math.sin(Math.PI * share)})`,
      opacity: 1,
      offset: (startsAt + share * duration) / total,
    };
  });
};

// a new marble lifts out of its base, glowing, and floats onto its start
const bringOut = (element, move, view, delay) => {
  const { scale, isTurned } = view;
  const owner = move.marble.owner;
  const from = pointOf(move.from, owner, isTurned);
  const final = pointOf(move.to, owner, isTurned);
  const timing = { duration: BRING_OUT_MS, delay, fill: "backwards", easing: "ease-in-out" };
  const ball = element.querySelector("[data-ball]");
  const animations = [
    element.animate(
      [
        { transform: `${offset(from, final, scale)} scale(1)`, opacity: 1 },
        ...floatFrames(from, final, final, scale, { startsAt: 0, duration: BRING_OUT_MS, total: BRING_OUT_MS, swell: 0.4 }),
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
      ],
      timing
    ),
    ball.animate(
      [{ filter: "brightness(1)" }, { filter: "brightness(1.5) drop-shadow(0 0 6px rgba(255, 228, 140, 0.95))", offset: 0.5 }, { filter: "brightness(1)" }],
      timing
    ),
  ];
  return { animations, arrivals: [0, BRING_OUT_MS], points: [from, final], final };
};

// one marble walking its path: the piece slides hole to hole while the ball inside swells toward you on each hop
const walk = (element, move, view, delay) => {
  if (move.from.at === "base") return bringOut(element, move, view, delay);
  const { scale, isTurned } = view;
  const owner = move.marble.owner;
  const points = placesOf(move).map((place) => pointOf(place, owner, isTurned));
  const final = pointOf(move.to, owner, isTurned);
  const arrivals = arrivalsOf(move);
  const walkMs = arrivals.at(-1);
  const total = durationOf(move);
  const frameAt = (point, time) => ({ transform: `${offset(point, final, scale)} scale(1)`, opacity: 1, offset: time / total, easing: "ease-in-out" });
  // a marble waits on a hole only where a king's sweep takes a marble, until its next hop sets off
  const frames = points.flatMap((point, index) => {
    const leaves = index + 1 < arrivals.length ? arrivals[index + 1] - HOP_MS : arrivals[index];
    return leaves > arrivals[index] ? [frameAt(point, arrivals[index]), frameAt(point, leaves)] : [frameAt(point, arrivals[index])];
  });
  if (move.teleport) {
    const swirl = points.at(-1);
    const setsOff = walkMs + SWIRL_PAUSE_MS;
    frames.push(frameAt(swirl, setsOff), ...floatFrames(swirl, final, final, scale, { startsAt: setsOff, duration: SWIRL_GLIDE_MS, total }), {
      transform: "translate(0, 0) scale(1)",
      opacity: 1,
      offset: 1,
    });
  }
  const hops = (rest, top) => [
    ...arrivals.slice(1).flatMap((arrival) => [
      { ...rest, offset: (arrival - HOP_MS) / total },
      { ...top, offset: (arrival - HOP_MS * 0.55) / total },
      { ...rest, offset: arrival / total },
    ]),
    { ...rest, offset: 1 },
  ];
  const ball = element.querySelector("[data-ball]");
  const shadow = element.querySelector("[data-shadow]");
  const timing = { duration: total, delay, fill: "backwards" };
  const animations = [
    element.animate(frames, timing),
    ball.animate(
      hops({ transform: "translateY(0) scale(1)", easing: "ease-in-out" }, { transform: `translateY(${-4 * scale}px) scale(1.35)`, easing: "ease-in-out" }),
      timing
    ),
    shadow.animate(hops({ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.8)", opacity: 0.5 }), timing),
  ];
  return { animations, arrivals, points, final };
};

// a marble arriving home is already drawn at its home size, so it is shown full size until it lands, then eased down
const settleHome = (element, delay) =>
  element.querySelector("[data-size]").animate([{ transform: "scale(1)" }, { transform: `scale(${HOME_SIZE})` }], {
    duration: 420,
    delay,
    easing: "ease-in-out",
    fill: "backwards",
  });

// a knocked-out marble is already drawn back in its base, so it is flown there from where it was hit
const knockOut = (element, from, to, view, delay) => {
  const { scale } = view;
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 60 };
  return element.animate(
    [
      { transform: `${offset(from, to, scale)} scale(1)`, opacity: 1 },
      { transform: `${offset(middle, to, scale)} scale(1.3)`, opacity: 1, offset: 0.5 },
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
    ],
    { duration: KNOCKOUT_MS, delay, easing: "cubic-bezier(0.3, 0.6, 0.3, 1)", fill: "backwards" }
  );
};

// one of a swap's marbles lifts, floats along its side of the crossing and settles in the other's place
const swapOver = (element, from, to, view, bend) =>
  element.animate(
    [
      { transform: `${offset(from, to, view.scale)} scale(1)`, opacity: 1 },
      { transform: `${offset(from, to, view.scale)} scale(1.3)`, opacity: 1, offset: 0.15 },
      ...floatFrames(from, to, to, view.scale, { startsAt: 0.15 * SWAP_MS, duration: 0.7 * SWAP_MS, total: SWAP_MS, bend, swell: 0.4 }),
      { transform: "translate(0, 0) scale(1.3)", opacity: 1, offset: 0.85 },
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
    ],
    { duration: SWAP_MS, delay: CARD_MS, easing: "ease-in-out", fill: "backwards" }
  );

// SWAP over the pile on a green glow, called out as the two marbles lift and kept up while they cross
const swapCall = (layer, scale) => {
  const glow = spawn(layer, layout.pile, 34, {
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(140, 235, 120, 0.9) 0%, rgba(70, 190, 80, 0.5) 40%, rgba(70, 190, 80, 0) 70%)",
  });
  const word = goldWord(layer, layout.pile, scale, "SWAP", 96);
  const timing = { duration: SWAP_MS, delay: CARD_MS, easing: "ease-out", fill: "backwards" };
  return [
    glow.animate(
      [
        { transform: "scale(0.2)", opacity: 0 },
        { transform: "scale(1)", opacity: 1, offset: 0.2 },
        { transform: "scale(1.1)", opacity: 0.85, offset: 0.7 },
        { transform: "scale(1.3)", opacity: 0 },
      ],
      timing
    ),
    word.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.3)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.15)", opacity: 1, offset: 0.15 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.25 },
        { transform: "translate(-50%, -50%) scale(0.9)", opacity: 1, offset: 0.75 },
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
      ],
      timing
    ),
  ].map(removedWhenDone);
};

// the card just played flies from where it was onto the pile
export const flyToPile = (pileTop, from) => {
  if (!pileTop || !from) return null;
  return pileTop.animate(
    [
      { transform: `${shiftBetween(from, pileTop.getBoundingClientRect())} rotate(-16deg) scale(1.15)`, opacity: 0.6 },
      { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
    ],
    { duration: CARD_MS, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" }
  );
};

// the back you picked turns away just where it lies, so the face turning in after it reads as the same card turning over
const backTurnsAway = (layer, from, delay) => {
  const stage = layer.getBoundingClientRect();
  const back = document.createElement("img");
  back.src = art.cardBack;
  Object.assign(back.style, {
    position: "absolute",
    left: `${from.left - stage.left}px`,
    top: `${from.top - stage.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    pointerEvents: "none",
  });
  layer.appendChild(back);
  return removedWhenDone(
    back.animate([{ transform: turnedTo(0) }, { transform: turnedTo(90, 6) }], { duration: FLIP_MS / 2, delay, easing: "ease-in", fill: "both" })
  );
};

// the card a red queen takes leaves its owner, turning face up if it was hidden, holds in the middle so both players see it, then lands grey on the pile
const takenToPile = (pileTop, from, delay, { isFaceDown, layer, comesAt = 0 }) => {
  if (!pileTop) return [];
  const to = pileTop.getBoundingClientRect();
  const placed = from ? `${shiftBetween(from, to)} scale(${Math.min(from.height / to.height, HELD)})` : `translate(0px, 0px) scale(${HELD})`;
  const held = `translate(0px, 0px) scale(${HELD}) ${turnedTo(0)}`;
  const start = `${placed} ${turnedTo(isFaceDown ? -90 : 0)}`;
  const inColour = "grayscale(0) brightness(1)";
  // the turn away comes out of the same time the server allows, so the play still ends when the next clock starts
  const turnsAway = isFaceDown && from ? [backTurnsAway(layer, from, delay)] : [];
  const faceAt = Math.max(comesAt, turnsAway.length ? FLIP_MS / 2 : 0);
  const face = pileTop.animate(
    [
      { transform: start, filter: inColour, opacity: 0 },
      { transform: start, filter: inColour, opacity: 1, offset: 0.05, easing: "ease-out" },
      { transform: held, filter: inColour, offset: 0.3 },
      { transform: held, filter: inColour, offset: 0.7 },
      { transform: `translate(0px, 0px) scale(1) ${turnedTo(0)}`, filter: getComputedStyle(pileTop).filter },
    ],
    { duration: TAKEN_MS - faceAt, delay: delay + faceAt, easing: "ease-in-out", fill: "backwards" }
  );
  return [...turnsAway, face];
};

// the red queen's victim sees their hand laid out over the pile as the taker's pick was, its cards' width and spacing shares of the board
const SPREAD = { share: 0.28, width: 0.21, step: 0.23 };
// names the spread a put-down queen leaves held out, so the pick that follows knows to start from there
const HELD_SPREAD = "held-spread";
const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.3, 1)";

const cardsIn = (hand) => [...(hand?.querySelectorAll("[data-card]") ?? [])];

const spreadOf = (stage, count) => {
  const board = stage.getBoundingClientRect();
  const width = board.width * SPREAD.width;
  const height = width / CARD_RATIO;
  const centre = { x: board.left + (layout.pile.x / layout.board) * board.width, y: board.top + (layout.pile.y / layout.board) * board.height };
  const slotX = (slot) => centre.x + (slot - (count - 1) / 2) * board.width * SPREAD.step;
  return { width, height, centre, slotX };
};

// a card's own tilt, and the transform that lays it in a slot of the spread instead, measured untilted since one replaces the other
const transformsOf = (card, spread, slot) => {
  const base = getComputedStyle(card).transform;
  card.style.transform = "none";
  const box = card.getBoundingClientRect();
  card.style.transform = "";
  const out = `translate(${spread.slotX(slot) - (box.left + box.width / 2)}px, ${spread.centre.y + spread.height / 2 - box.bottom}px) scale(${spread.width / box.width})`;
  return { base, out };
};

// the moment a red queen goes down its victim's hand goes out over the pile in full colour, and stays there until the pick
const spreadOut = (hand, stage, delay) => {
  const cards = cardsIn(hand);
  const spread = spreadOf(stage, cards.length);
  const timing = { duration: TAKEN_MS * SPREAD.share, delay, easing: EASE_OUT, fill: "forwards" };
  const animations = cards.flatMap((card, slot) => {
    const { base, out } = transformsOf(card, spread, slot);
    const lift = card.querySelector(".lift");
    return [
      card.animate([{ transform: base }, { transform: out }], timing),
      lift.animate([{ filter: getComputedStyle(lift).filter }, { filter: UNDIMMED }], timing),
    ];
  });
  animations.forEach((animation) => {
    animation.id = HELD_SPREAD;
  });
  return animations;
};

// the hand goes out, or is already out from its queen, while the taken card leaves its slot, then the rest come back and dim again
const spreadHand = (hand, stage, lostAt, delay) => {
  const cards = cardsIn(hand);
  const held = cards.flatMap((card) => card.getAnimations({ subtree: true }).filter((animation) => animation.id === HELD_SPREAD));
  held.forEach((animation) => animation.cancel());
  const isHeld = held.length > 0;
  const spread = spreadOf(stage, cards.length + 1);
  const timing = { duration: TAKEN_MS, delay };
  const animations = cards.flatMap((card, index) => {
    const { base, out } = transformsOf(card, spread, index < lostAt ? index : index + 1);
    const lift = card.querySelector(".lift");
    const dimmed = getComputedStyle(lift).filter;
    const outAt = isHeld ? 0 : SPREAD.share;
    return [
      card.animate(
        [
          ...(isHeld ? [] : [{ transform: base, easing: EASE_OUT }]),
          { transform: out, offset: outAt },
          { transform: out, offset: 0.55, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
          { transform: base, offset: 0.85 },
          { transform: base },
        ],
        timing
      ),
      lift.animate(
        [
          ...(isHeld ? [] : [{ filter: dimmed }]),
          { filter: UNDIMMED, offset: outAt },
          { filter: UNDIMMED, offset: 0.55 },
          { filter: dimmed, offset: 0.85 },
          { filter: dimmed },
        ],
        timing
      ),
    ];
  });
  const takenFrom = { left: spread.slotX(lostAt) - spread.width / 2, top: spread.centre.y - spread.height / 2, width: spread.width, height: spread.height };
  return { animations, takenFrom, isHeld };
};

// a player's card of a deal leaves the deck after every card dealt before it, the deal alternating from the leader
export const dealOrder = (index, isFirst) => DEAL.firstCardAt + (index * 2 + (isFirst ? 0 : 1)) * DEAL.cardGap;

// a card flies into a hand from a rect; one of yours travels face down, a bonus with its gold +1, and turns over as it lands
export const flyIn = (element, from, delay, { flight = DEAL.flight, back = null, plus = null } = {}) => {
  const away = `${shiftBetween(from, element.getBoundingClientRect())} scale(0.6) rotate(-8deg)`;
  const timing = { duration: flight + (back ? FLIP_MS : 0), delay, fill: "backwards" };
  const lands = flight / timing.duration;
  const turned = lands + (1 - lands) / 2;
  const flying = "cubic-bezier(0.2, 0.8, 0.3, 1)";
  const frames = [
    { transform: away, opacity: 0, easing: flying },
    { transform: away, opacity: 1, offset: 0.06, easing: flying },
    { transform: back ? turnedTo(0) : "none", opacity: 1, offset: lands, easing: "ease-in" },
  ];
  if (back)
    frames.push(
      { transform: turnedTo(90, 6), opacity: 1, offset: turned },
      { transform: turnedTo(-90, 6), opacity: 1, offset: turned, easing: "ease-out" },
      { transform: turnedTo(0), opacity: 1 }
    );
  const facesDown = [{ opacity: 1 }, { opacity: 1, offset: turned }, { opacity: 0, offset: turned }, { opacity: 0 }];
  return [element.animate(frames, timing), ...[back, plus].filter(Boolean).map((layer) => layer.animate(facesDown, timing))];
};

// one of their cards grows out of its place in their fan into the red queen's pick
export const growFrom = (element, from, delay) => {
  const at = element.getBoundingClientRect();
  return element.animate([{ transform: `${shiftBetween(from, at)} scale(${from.width / at.width})` }, { transform: "none" }], {
    duration: GROW_MS,
    delay,
    easing: "cubic-bezier(0.2, 0.8, 0.3, 1.1)",
    fill: "backwards",
  });
};

// a card not taken by the red queen flies back into its place in their fan, from wherever its grow is when you tap, and stays there until the fan shows again
export const flyBack = (element, to) => {
  const at = element.getBoundingClientRect();
  return element.animate(
    [{ transform: getComputedStyle(element).transform }, { transform: `${shiftBetween(to, at)} scale(${to.ownWidth / at.width}) rotate(${to.tilt}deg)` }],
    {
      duration: BACK_MS,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    }
  );
};

// the other player's bonus card swells into their hand with a gold flash
export const arriveAsBonus = (element, delay) =>
  element.animate(
    [
      { transform: "scale(0)", filter: "drop-shadow(0 0 0 rgba(255, 210, 90, 0))" },
      { transform: "scale(1.6)", filter: "drop-shadow(0 0 8px rgba(255, 210, 90, 1))", offset: 0.5 },
      { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(255, 210, 90, 0))" },
    ],
    { duration: BONUS.flight, delay, easing: "ease-out", fill: "backwards" }
  );

// the middle of a player's home lane, where its cheers rise from
const homeLaneOf = (owner, isTurned) => {
  const deep = pointOf({ at: "home", slot: 1 }, owner, isTurned);
  const shallow = pointOf({ at: "home", slot: 2 }, owner, isTurned);
  return { x: (deep.x + shallow.x) / 2, y: (deep.y + shallow.y) / 2 };
};

// everything one play does, in order; returns a way to cut it short when the next play arrives
export const playOut = (lastPlay, view, { stage, effects, marbles, pileCards, playedFrom, takenFrom, myHand }) => {
  const animations = [];
  const timers = [];
  const at = (delay, task) => timers.push(setTimeout(task, delay));
  // a red queen lies under the card it took
  const thrown = flyToPile(lastPlay.lost ? pileCards.at(-2) : pileCards.at(-1), playedFrom);
  const takenAt = thrown ? CARD_MS : 0;
  const isMineTaken = Boolean(lastPlay.lost) && 1 - lastPlay.seat === view.mySeat && lastPlay.lostAt !== undefined;
  const spread = isMineTaken ? spreadHand(myHand, stage, lastPlay.lostAt, takenAt) : null;
  animations.push(...(spread?.animations ?? []));
  if (lastPlay.kind === "show" && faceOf(lastPlay.card) === "take" && 1 - lastPlay.seat === view.mySeat) {
    animations.push(...spreadOut(myHand, stage, thrown ? CARD_MS : 0));
  }
  const taken = lastPlay.lost
    ? takenToPile(pileCards.at(-1), spread?.takenFrom ?? takenFrom, takenAt, {
        isFaceDown: 1 - lastPlay.seat !== view.mySeat,
        layer: effects,
        comesAt: spread && !spread.isHeld ? TAKEN_MS * SPREAD.share : 0,
      })
    : [];
  animations.push(...[thrown, ...taken].filter(Boolean));
  // a card you played made its sound as it landed, so only a throw-away still owes one
  const isThrownAway = THROWS.includes(lastPlay.kind);
  if (thrown) at(CARD_MS, isThrownAway ? SOUNDS.trash : SOUNDS.cardDown);
  else if (isThrownAway) at(0, SOUNDS.trash);
  if (lastPlay.kind === "discardOther") at(CARD_MS, SOUNDS.stamp);
  if (taken.length) {
    at(takenAt, () => SOUNDS.cardIn());
    at(takenAt + TAKEN_MS * 0.85, SOUNDS.trash);
  }
  const marblesSetOff = CARD_MS + MARBLE_AFTER_CARD_MS;
  let cheers = 0;

  for (const move of lastPlay.moves ?? []) {
    const element = marbles.get(marbleKey(move.marble));
    if (!element) continue;
    const walked = walk(element, move, view, marblesSetOff);
    animations.push(...walked.animations);
    if (move.from.at === "base") at(marblesSetOff + BRING_OUT_MS, SOUNDS.land);
    else walked.arrivals.slice(1).forEach((arrival, step) => at(marblesSetOff + arrival, () => SOUNDS.hop(step)));
    if (move.teleport) {
      at(marblesSetOff + walked.arrivals.at(-1) + SWIRL_PAUSE_MS, SOUNDS.jump);
      at(marblesSetOff + durationOf(move), SOUNDS.land);
    }
    if (move.to.at === "home" && move.from.at !== "home") animations.push(settleHome(element, marblesSetOff + durationOf(move)));
    for (const { marble, step } of move.captured) {
      const isOnPath = step <= move.path.length;
      const hitAt = isOnPath ? walked.points[step] : walked.final;
      const when = marblesSetOff + (isOnPath ? walked.arrivals[step] : durationOf(move));
      const target = marbles.get(marbleKey(marble));
      if (target) animations.push(knockOut(target, hitAt, pointOf({ at: "base", slot: marble.id }, marble.owner, view.isTurned), view, when));
      at(when, () => {
        SOUNDS.hit();
        animations.push(...dust(effects, hitAt, view.scale), shake(stage, view.scale));
      });
    }
    if (move.to.at === "home" && move.marble.owner === lastPlay.seat) {
      // a second marble home in the same play cheers just above the first
      const lane = homeLaneOf(move.marble.owner, view.isTurned);
      const point = { x: lane.x, y: lane.y - cheers * 90 };
      cheers += 1;
      at(marblesSetOff + durationOf(move), () => {
        SOUNDS.home();
        animations.push(...awesome(effects, point, view.scale), ...glitter(effects, walked.final, view.scale));
      });
    }
  }

  if (lastPlay.swap) {
    const [mine, theirs] = lastPlay.swap;
    const mineElement = marbles.get(marbleKey(mine));
    const theirElement = marbles.get(marbleKey(theirs));
    const minePoint = mineElement && pointOf(view.placeOf(mine), mine.owner, view.isTurned);
    const theirPoint = theirElement && pointOf(view.placeOf(theirs), theirs.owner, view.isTurned);
    if (minePoint && theirPoint) {
      animations.push(swapOver(mineElement, theirPoint, minePoint, view, 0.35), swapOver(theirElement, minePoint, theirPoint, view, -0.35));
      animations.push(...swapCall(effects, view.scale));
      at(CARD_MS, SOUNDS.swap);
    }
  }
  if (view.winner !== null) {
    at(lengthOf(lastPlay), () =>
      [0, 1, 2, 3].forEach((slot) => animations.push(...goldBurst(effects, pointOf({ at: "home", slot }, view.winner, view.isTurned), view.scale)))
    );
    // a beat after the last marble lands, so the jingle follows its cheer rather than drowning it; someone watching hears the win
    at(lengthOf(lastPlay) + 300, view.winner === view.mySeat || view.mySeat === -1 ? SOUNDS.won : SOUNDS.lost);
  }

  return () => {
    timers.forEach(clearTimeout);
    animations.forEach((animation) => animation.finish());
  };
};
