import { HOME_ENTRY, LOOP, START } from "#src/services/games/jackaroo/board.js";
import { isRed } from "#src/services/games/jackaroo/cards.js";
import { keyOf, losingPlays, other, placeOf, progressOf } from "#src/services/games/jackaroo/moves.js";
import { turnPlays } from "#src/services/games/jackaroo/rules.js";

// the furthest any single card carries a marble, so a marble this close behind another can land on it
const REACH = 13;

// how often it plays without looking, tuned by simulating games against it
export const DISTRACTED = { opponent: 0.3, standIn: 0.5 };

const anyOf = (items) => items[Math.floor(Math.random() * items.length)];

const isExposed = (state, seat, index) =>
  state.players[other(seat)].marbles.some((place) => {
    if (place.at !== "track") return false;
    const gap = (index - place.index + LOOP) % LOOP;
    return gap > 0 && gap <= REACH;
  });

const scoreMove = (state, seat, move) => {
  const { owner } = move.marble;
  const gained = progressOf(owner, move.to) - progressOf(owner, move.from);
  let score = owner === seat ? gained : -gained * 0.6;
  for (const { marble } of move.captured) {
    const lost = 30 + progressOf(marble.owner, placeOf(state, marble));
    score += marble.owner === seat ? -lost : lost + 25;
  }
  if (owner !== seat) return score;
  if (move.from.at === "base") score += 30;
  if (move.to.at === "home" && move.from.at !== "home") score += 40;
  if (move.to.at === "track" && move.to.index !== START[seat] && isExposed(state, seat, move.to.index)) score -= 12;
  if (move.from.at === "track" && isExposed(state, seat, move.from.index)) score += 8;
  // parked in front of home, the next small card takes it in
  if (move.to.at === "track" && move.to.index === HOME_ENTRY[seat]) score += 6;
  return score;
};

// cards that rescue a stuck hand are worth keeping when one has to go
const cardValue = (card) => {
  const special = { 1: 8, 2: 6, 4: 5, 5: 4, 7: 7, 10: 5, 11: isRed(card) ? 3 : 6, 12: isRed(card) ? 5 : 3, 13: 9 };
  return special[card.rank] ?? card.rank / 3;
};

const homeCount = (state, seat) => state.players[seat].marbles.filter((place) => place.at === "home").length;

const finishes = (state, seat, play) =>
  homeCount(state, seat) + (play.moves ?? []).filter((move) => move.marble.owner === seat && move.to.at === "home" && move.from.at !== "home").length === 4;

const scorePlay = (state, seat, play) => {
  if (play.kind === "discard") return -cardValue(play.card);
  if (play.kind === "discardAll") return 0;
  if (play.kind === "discardOther") return 12;
  if (play.kind === "takeCard") return 14;
  if (play.kind === "swap") {
    const [mine, theirs] = play.swap;
    const minePlace = placeOf(state, mine);
    const theirPlace = placeOf(state, theirs);
    return progressOf(seat, theirPlace) - progressOf(seat, minePlace) + progressOf(theirs.owner, theirPlace) - progressOf(theirs.owner, minePlace);
  }
  return play.moves.reduce((total, move) => total + scoreMove(state, seat, move), 0);
};

const moveFor = (state, seat, play) =>
  play.kind === "takeCard" ? { key: keyOf(play), taken: Math.floor(Math.random() * state.players[other(seat)].hand.length) } : { key: keyOf(play) };

const choosePlay = (state, seat, plays, level) => {
  // a win is always taken, because walking past one looks broken rather than kind
  const winning = plays.find((play) => finishes(state, seat, play));
  if (winning) return winning;
  if (Math.random() < DISTRACTED[level]) return anyOf(plays);
  const scored = plays.map((play) => ({ play, score: scorePlay(state, seat, play) }));
  const best = Math.max(...scored.map(({ score }) => score));
  return anyOf(scored.filter(({ score }) => score === best)).play;
};

const hasChoicesLeft = (plays, play) => play.kind === "takeCard" || plays.filter((option) => option.card?.id === play.card?.id).length > 1;

// an ordinary player: it weighs each play on its own and never plans a turn ahead, so it can be outplayed
export const botMove = (state, seat, level = "opponent") => {
  if (state.pending) {
    const keep = losingPlays(state, seat).reduce((worst, play) => (cardValue(play.card) < cardValue(worst.card) ? play : worst));
    return { key: keyOf(keep) };
  }
  const plays = turnPlays(state, seat);
  const chosen = choosePlay(state, seat, plays, level);
  // a bot playing for itself puts a card with choices down first, as a player does; one standing in for a late player just finishes
  if (level !== "standIn" && !state.shown && hasChoicesLeft(plays, chosen)) return { show: chosen.card.id };
  return moveFor(state, seat, chosen);
};
