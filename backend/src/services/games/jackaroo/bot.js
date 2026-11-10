import { HOME_ENTRY, LOOP, START } from "#src/services/games/jackaroo/board.js";
import { isRed } from "#src/services/games/jackaroo/cards.js";
import { keyOf, losingPlays, moveMarble, other, placeOf, progressOf } from "#src/services/games/jackaroo/moves.js";
import { turnPlays } from "#src/services/games/jackaroo/rules.js";

// the furthest any single card carries a marble, so a marble this close behind another can land on it
const REACH = 13;

// how often each level plays without looking, tuned by simulating games against it
export const DISTRACTED = { dumb: 0.7, medium: 0.3, pro: 0.08, standIn: 0.5 };
// how likely a marble left within reach is to be hit before it moves again
const RISK = 0.7;

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

const boardAfter = (state, play) => {
  const board = { ...state, players: state.players.map((player) => ({ ...player, marbles: [...player.marbles] })) };
  (play.moves ?? []).forEach((move) => moveMarble(board, move));
  if (play.kind === "swap") {
    const [mine, theirs] = play.swap;
    board.players[mine.owner].marbles[mine.id] = placeOf(state, theirs);
    board.players[theirs.owner].marbles[theirs.id] = placeOf(state, mine);
  }
  return board;
};

// what a seat stands to lose, every marble left within the other player's reach weighed by how far it has come
const atRisk = (board, seat) =>
  board.players[seat].marbles.reduce((risk, place) => {
    if (place.at !== "track" || place.index === START[seat] || !isExposed(board, seat, place.index)) return risk;
    return risk + 30 + progressOf(seat, place);
  }, 0);

// an expert weighs a play by the whole board it leaves, so it stops leaving marbles where the rival can knock them out
const expertScore = (state, seat, play) => scorePlay(state, seat, play) + (atRisk(state, seat) - atRisk(boardAfter(state, play), seat)) * RISK;

const moveFor = (state, seat, play) =>
  play.kind === "takeCard" ? { key: keyOf(play), taken: Math.floor(Math.random() * state.players[other(seat)].hand.length) } : { key: keyOf(play) };

const choosePlay = (state, seat, plays, level) => {
  // a win is always taken, because walking past one looks broken rather than kind
  const winning = plays.find((play) => finishes(state, seat, play));
  if (winning) return winning;
  if (Math.random() < DISTRACTED[level]) return anyOf(plays);
  const scoreOf = level === "expert" ? expertScore : scorePlay;
  const scored = plays.map((play) => ({ play, score: scoreOf(state, seat, play) }));
  const best = Math.max(...scored.map(({ score }) => score));
  return anyOf(scored.filter(({ score }) => score === best)).play;
};

const hasChoicesLeft = (plays, play) => play.kind === "takeCard" || plays.filter((option) => option.card?.id === play.card?.id).length > 1;

// an ordinary player weighs each play by the marbles it moves, so it walks into knock-outs an expert sees coming
export const botMove = (state, seat, level = "medium") => {
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

export const BOT_MOODS = {
  knockedOut: "proud",
  knockedBack: "hurt",
  ownGoal: "oops",
  reachedHome: "proud",
  rivalHome: "worried",
  cardTaken: "hurt",
  tookCard: "proud",
  swapped: "proud",
};

const LOSES_A_CARD = ["takeCard", "discardOther"];

const sentBack = (before, after, owner) =>
  before.players[owner].marbles.some((place, id) => place.at !== "base" && after.players[owner].marbles[id].at === "base");

const arrivedHome = (before, after, owner) =>
  before.players[owner].marbles.some((place, id) => place.at !== "home" && after.players[owner].marbles[id].at === "home");

// a card put down before its choices are made is not a play yet, so only a play the state newly records counts
const newPlayIn = (before, after) => (JSON.stringify(after.lastPlay) === JSON.stringify(before.lastPlay) ? null : after.lastPlay);

export const momentFor = (before, after, seat) => {
  const play = newPlayIn(before, after);
  if (!play) return null;
  const isMine = play.seat === seat;
  if (sentBack(before, after, seat)) return isMine ? "ownGoal" : "knockedBack";
  if (!isMine) {
    if (LOSES_A_CARD.includes(play.kind)) return "cardTaken";
    return arrivedHome(before, after, other(seat)) ? "rivalHome" : null;
  }
  if (sentBack(before, after, other(seat))) return "knockedOut";
  if (arrivedHome(before, after, seat)) return "reachedHome";
  if (LOSES_A_CARD.includes(play.kind)) return "tookCard";
  return play.kind === "swap" ? "swapped" : null;
};
