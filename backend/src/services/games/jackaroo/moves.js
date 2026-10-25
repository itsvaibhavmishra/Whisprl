// Every way a card can be played on a given board, worked out without changing it.
import { HOME_ENTRY, HOME_SLOTS, LOOP, START, TELEPORTS } from "#src/services/games/jackaroo/board.js";
import { isRed } from "#src/services/games/jackaroo/cards.js";

export const other = (seat) => 1 - seat;
const sameMarble = (one, two) => one.owner === two.owner && one.id === two.id;
export const placeOf = (state, marble) => state.players[marble.owner].marbles[marble.id];

const marblesOf = (state, owner) => state.players[owner].marbles.map((_, id) => ({ owner, id }));
const isOut = (state, marble) => placeOf(state, marble).at !== "base";
const isOnTrack = (state, marble) => placeOf(state, marble).at === "track";

const marbleAt = (state, index) => {
  for (const owner of [0, 1]) {
    const id = state.players[owner].marbles.findIndex((place) => place.at === "track" && place.index === index);
    if (id !== -1) return { owner, id };
  }
  return null;
};

// a marble sitting on its own start can be neither passed nor landed on, and the other player's 5 and jack cannot take it
const isOnOwnStart = (state, marble) => {
  const place = placeOf(state, marble);
  return place.at === "track" && place.index === START[marble.owner];
};

// another player's marble on the hole in front of a home shuts it, so its owner can neither turn in nor move on inside
export const blockerOf = (state, owner) => {
  const occupant = marbleAt(state, HOME_ENTRY[owner]);
  return occupant && occupant.owner !== owner ? occupant : null;
};

const homeSlotTaken = (state, owner, slot) => state.players[owner].marbles.some((place) => place.at === "home" && place.slot === slot);

const fitsHome = (state, owner, steps) => {
  if (steps > HOME_SLOTS) return false;
  for (let slot = 0; slot < steps; slot += 1) if (homeSlotTaken(state, owner, slot)) return false;
  return true;
};

// the holes a marble steps through, who it knocks out and where it stops, or null; moved by its owner it never runs past home
const walk = (state, marble, steps, { forward = true, byOwner = true, sweep = false } = {}) => {
  let place = placeOf(state, marble);
  if (place.at === "base" || (place.at === "home" && !forward)) return null;
  const path = [];
  const captured = [];
  let jumped = 0;
  const blocker = byOwner ? blockerOf(state, marble.owner) : null;
  // a king knocks out the blocker as it passes, which opens the home for the rest of the same move
  const isShut = () => Boolean(blocker) && !captured.some((knocked) => sameMarble(knocked.marble, blocker));
  for (let step = 1; step <= steps; step += 1) {
    if (place.at === "home") {
      if (isShut() || place.slot + 1 >= HOME_SLOTS || homeSlotTaken(state, marble.owner, place.slot + 1)) return null;
      place = { at: "home", slot: place.slot + 1 };
      path.push(place);
      continue;
    }
    if (forward && byOwner && place.index === HOME_ENTRY[marble.owner]) {
      if (isShut() || !fitsHome(state, marble.owner, steps - step + 1)) return null;
      place = { at: "home", slot: 0 };
      path.push(place);
      continue;
    }
    const index = (place.index + (forward ? 1 : LOOP - 1)) % LOOP;
    const occupant = marbleAt(state, index);
    if (occupant && !sameMarble(occupant, marble)) {
      if (isOnOwnStart(state, occupant)) return null;
      if (sweep || step === steps) captured.push({ marble: occupant, step });
      else {
        // any marble may be jumped, your own too, but only one in a move
        jumped += 1;
        if (jumped > 1) return null;
      }
    }
    place = { at: "track", index };
    path.push(place);
  }
  return { marble, from: placeOf(state, marble), path, to: place, captured };
};

// landing on a swirl always jumps to its twin, even past home, knocking out whatever marble waits there unless it sits on its own start
const withTeleport = (state, move) => {
  const exit = move.to.at === "track" ? TELEPORTS[move.to.index] : undefined;
  if (exit === undefined) return move;
  const occupant = marbleAt(state, exit);
  if (occupant && isOnOwnStart(state, occupant)) return null;
  const to = { at: "track", index: exit };
  const captured = occupant ? [...move.captured, { marble: occupant, step: move.path.length + 1 }] : move.captured;
  return { ...move, to, teleport: { from: move.to, to }, captured };
};

// a marble's whole move: its walk, then the jump of any swirl it lands on, going forward or back
const travel = (state, marble, steps, options) => {
  const move = walk(state, marble, steps, options);
  return move && withTeleport(state, move);
};

const bringOut = (state, seat) => {
  const id = state.players[seat].marbles.findIndex((place) => place.at === "base");
  if (id === -1) return null;
  const occupant = marbleAt(state, START[seat]);
  if (occupant?.owner === seat) return null;
  const marble = { owner: seat, id };
  const to = { at: "track", index: START[seat] };
  return { marble, from: placeOf(state, marble), path: [to], to, captured: occupant ? [{ marble: occupant, step: 1 }] : [] };
};

export const moveMarble = (state, move) => {
  for (const { marble } of move.captured) state.players[marble.owner].marbles[marble.id] = { at: "base", slot: marble.id };
  state.players[move.marble.owner].marbles[move.marble.id] = move.to;
};

const asPlays = (card, kind, moves) => moves.filter(Boolean).map((move) => ({ card, kind, moves: [move] }));

const forwardPlays = (state, seat, card, steps) =>
  asPlays(
    card,
    "move",
    marblesOf(state, seat)
      .filter((marble) => isOut(state, marble))
      .map((marble) => travel(state, marble, steps))
  );

const outPlays = (state, seat, card) => asPlays(card, "out", [bringOut(state, seat)]);

// back four may leave from the start, which is the quick way round to home, but never goes into a home
const backPlays = (state, seat, card) =>
  asPlays(
    card,
    "back",
    marblesOf(state, seat)
      .filter((marble) => isOnTrack(state, marble))
      .map((marble) => travel(state, marble, 4, { forward: false }))
  );

// a five moves anyone's marble; only its own player can take it home, so the other player's runs on past it
const fivePlays = (state, seat, card) =>
  [0, 1].flatMap((owner) =>
    asPlays(
      card,
      "move",
      marblesOf(state, owner)
        .filter((marble) => (owner === seat ? isOut(state, marble) : isOnTrack(state, marble) && !isOnOwnStart(state, marble)))
        .map((marble) => travel(state, marble, 5, { byOwner: owner === seat }))
    )
  );

const splitPlays = (state, seat, card) => {
  const plays = [];
  const mine = marblesOf(state, seat).filter((marble) => isOut(state, marble));
  for (const first of mine) {
    for (let steps = 1; steps < 7; steps += 1) {
      const firstMove = travel(state, first, steps);
      if (!firstMove) continue;
      const after = structuredClone(state);
      moveMarble(after, firstMove);
      for (const second of mine) {
        if (sameMarble(first, second) || !isOut(after, second)) continue;
        const secondMove = travel(after, second, 7 - steps);
        if (secondMove) plays.push({ card, kind: "split", moves: [firstMove, secondMove] });
      }
    }
  }
  return plays;
};

// your own marble may be swapped off your start, but theirs cannot be taken off its own
const swapPlays = (state, seat, card) => {
  const theirs = marblesOf(state, other(seat)).filter((marble) => isOnTrack(state, marble) && !isOnOwnStart(state, marble));
  return marblesOf(state, seat)
    .filter((marble) => isOnTrack(state, marble))
    .flatMap((mine) => theirs.map((marble) => ({ card, kind: "swap", swap: [mine, marble] })));
};

// a king's thirteen knocks out everyone it passes, its own player's marbles included, and goes home like any move
const sweepPlays = (state, seat, card) =>
  asPlays(
    card,
    "sweep",
    marblesOf(state, seat)
      .filter((marble) => isOnTrack(state, marble))
      .map((marble) => travel(state, marble, 13, { sweep: true }))
  );

const hasCardsToLose = (state, seat) => state.players[other(seat)].hand.length > 0;

const playsFor = (state, seat, card) => {
  switch (card.rank) {
    case 1:
    case 2:
      return [...outPlays(state, seat, card), ...forwardPlays(state, seat, card, card.rank)];
    case 4:
      return backPlays(state, seat, card);
    case 5:
      return fivePlays(state, seat, card);
    case 7:
      return [...forwardPlays(state, seat, card, 7), ...splitPlays(state, seat, card)];
    case 10:
      return [...forwardPlays(state, seat, card, 10), ...(hasCardsToLose(state, seat) ? [{ card, kind: "discardOther" }] : [])];
    case 11:
      return isRed(card) ? forwardPlays(state, seat, card, 11) : swapPlays(state, seat, card);
    case 12:
      if (!isRed(card)) return forwardPlays(state, seat, card, 12);
      return hasCardsToLose(state, seat) ? [{ card, kind: "takeCard" }] : [];
    case 13:
      return [...outPlays(state, seat, card), ...sweepPlays(state, seat, card)];
    default:
      return forwardPlays(state, seat, card, card.rank);
  }
};

const placeKey = ({ at, index, slot }) => (at === "track" ? `t${index}` : `${at[0]}${slot}`);
const marbleKey = ({ owner, id }) => `${owner}.${id}`;

// a play is named by what it does, so the client sends a name and the server finds the same play in its own list
export const keyOf = (play) => {
  const parts = [play.card?.id ?? "hand", play.kind];
  if (play.moves) parts.push(play.moves.map((move) => `${marbleKey(move.marble)}>${placeKey(move.to)}`).join(","));
  if (play.swap) parts.push(play.swap.map(marbleKey).join("x"));
  return parts.join(":");
};

const legalPlays = (state, seat) => state.players[seat].hand.flatMap((card) => playsFor(state, seat, card));

// only the other player can change a stuck hand, and they cannot when they hold no cards or none of yours is on the track
const isStuckForTheRound = (state, seat) => !state.players[other(seat)].hand.length || !marblesOf(state, seat).some((marble) => isOnTrack(state, marble));

export const playsForTurn = (state, seat) => {
  const plays = legalPlays(state, seat);
  const { hand } = state.players[seat];
  if (plays.length || !hand.length) return plays;
  if (isStuckForTheRound(state, seat)) return [{ kind: "discardAll" }];
  return hand.map((card) => ({ card, kind: "discard" }));
};

// a card lost to a ten is the loser's own choice
export const losingPlays = (state, seat) => state.players[seat].hand.map((card) => ({ card, kind: "lose" }));

export const knocksOut = (play) => (play.moves ?? []).some((move) => move.captured.length > 0);

const isDeepestFree = (state, owner, slot) => {
  for (let deeper = slot + 1; deeper < HOME_SLOTS; deeper += 1) if (!homeSlotTaken(state, owner, deeper)) return false;
  return true;
};

// read on the board after the play: going home earns a card only for a marble that reached the deepest hole still free
export const settlesHome = (state, play, seat) =>
  (play.moves ?? []).some((move) => move.marble.owner === seat && move.to.at === "home" && isDeepestFree(state, seat, move.to.slot));

// how far round a marble has come, from its start to the last home slot
export const progressOf = (owner, place) => {
  if (place.at === "base") return -1;
  if (place.at === "home") return LOOP - 1 + place.slot;
  return (place.index - START[owner] + LOOP) % LOOP;
};
