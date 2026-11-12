import createHttpError from "http-errors";

import { coloursFor } from "#src/services/games/colours.js";
import { MARBLES, TABLES, tableOf } from "#src/services/games/jackaroo/board.js";
import { newDeck, shuffled } from "#src/services/games/jackaroo/cards.js";
import {
  blockerOf,
  keyOf,
  knocksOut,
  losingPlays,
  isPartner,
  moveMarble,
  nextSeat,
  placeOf,
  playsFor,
  playsForTurn,
  seatsOf,
  settlesHome,
} from "#src/services/games/jackaroo/moves.js";

const DECK_SIZE = 52;
// only the top of the pile is ever shown, so only the top is kept
const PILE_KEPT = 3;
const THROWN = ["discard", "discardAll", "lose"];

const openDeck = (state) => {
  state.decks += 1;
  state.shoe = shuffled(newDeck(state.decks));
};

// bonus cards come from what the deals leave in the deck, and a fresh deck covers a game that uses all of it
const drawCard = (state) => {
  if (!state.shoe.length) openDeck(state);
  return state.shoe.pop();
};

// every seat from the given one, in the order turns pass
const roundFrom = (state, seat) => seatsOf(state).map((offset) => (seat + offset) % state.players.length);

const dealRound = (state) => {
  const { roundSizes } = tableOf(state);
  const roundOfDeck = state.round % roundSizes.length;
  if (roundOfDeck === 0) openDeck(state);
  for (let card = 0; card < roundSizes[roundOfDeck]; card += 1) {
    for (const seat of roundFrom(state, state.leader)) state.players[seat].hand.push(drawCard(state));
  }
  state.round += 1;
};

const startingMarbles = (table, seat) =>
  Array.from({ length: MARBLES }, (_, slot) => (slot < table.startsOut ? { at: "track", index: table.start[seat] } : { at: "base", slot }));

// mode is "single" for one against one and "teams" for two against two
export const setup = (previous, { players, seating = null, mode = "single" } = {}) => {
  const table = TABLES[mode];
  const seats = Array.from({ length: players ?? table.seats }, (_, seat) => seat);
  // a draw decides who opens the first game, and the opener moves round the table after that
  const first = previous ? (previous.first + 1) % seats.length : Math.floor(Math.random() * seats.length);
  const state = {
    mode,
    seating,
    colours: coloursFor(previous, seats.length, seating),
    players: seats.map((seat) => ({ hand: [], marbles: startingMarbles(table, seat) })),
    shoe: [],
    decks: 0,
    pile: [],
    first,
    // who leads every round of the current deck; the lead passes round the table with each new deck
    leader: first,
    turn: first,
    round: 0,
    // a ten makes it the next player's turn until they choose the card they lose
    pending: null,
    // a card put down before its choices are made, on the pile for both players while its player decides
    shown: null,
    winner: null,
    plays: 0,
    lastPlay: null,
  };
  dealRound(state);
  return state;
};

export const turnOf = (state) => state.pending?.seat ?? state.turn;

// what the player to move may do now: lose a card to a ten, finish the card they put down, or play any card
export const turnPlays = (state, seat) => {
  if (state.pending) return losingPlays(state, seat);
  return state.shown ? playsFor(state, seat, state.shown.card) : playsForTurn(state, seat);
};

// once seat's turn is over the turn goes to the next player still holding cards, and a new round comes when nobody does
const passTurn = (state, seat) => {
  const holder = roundFrom(state, nextSeat(state, seat)).find((candidate) => state.players[candidate].hand.length);
  if (holder !== undefined) {
    state.turn = holder;
    return false;
  }
  if (state.round % tableOf(state).roundSizes.length === 0) state.leader = nextSeat(state, state.leader);
  state.turn = state.leader;
  dealRound(state);
  return true;
};

// each card keeps whose it was, since its face draws that player's marble in their colour, and its round, since a deal clears the pile
const toPile = (state, card, seat, thrown) => {
  state.pile = [...state.pile, { card, seat, thrown, round: state.round }].slice(-PILE_KEPT);
};

const takeFromHand = (state, seat, cardId) => {
  const hand = state.players[seat].hand;
  return hand.splice(
    hand.findIndex((card) => card.id === cardId),
    1
  )[0];
};

// partners win together, once all eight of their marbles are home
const winnersOf = (state, seat) => seatsOf(state).filter((owner) => isPartner(state, seat, owner));
const hasWon = (state, seat) => winnersOf(state, seat).every((owner) => state.players[owner].marbles.every((place) => place.at === "home"));

// what just happened, kept whole so every client can play the same move out
const record = (state, seat, play, extra = {}) => {
  state.plays += 1;
  state.lastPlay = { seat, card: play.card ?? null, kind: play.kind, moves: play.moves ?? null, swap: play.swap ?? null, ...extra };
  return state;
};

// losing a card to a ten is the loser's whole turn, so the ten's player goes next
const loseCard = (state, seat, move) => {
  const chosen = losingPlays(state, seat).find((option) => keyOf(option) === move?.key);
  if (!chosen) throw createHttpError.BadRequest("Pick one of your own cards to throw away");
  toPile(state, takeFromHand(state, seat, chosen.card.id), seat, true);
  state.pending = null;
  return record(state, seat, chosen, { dealt: passTurn(state, seat) });
};

const swapMarbles = (state, [mine, theirs]) => {
  const minePlace = placeOf(state, mine);
  state.players[mine.owner].marbles[mine.id] = placeOf(state, theirs);
  state.players[theirs.owner].marbles[theirs.id] = minePlace;
};

// a card put down cannot be taken back, so it leaves the hand for the pile now and its play is finished later
const showCard = (state, seat, cardId) => {
  if (state.shown) throw createHttpError.BadRequest("Finish the card you put down first");
  const isPlayable = playsForTurn(state, seat).some((option) => option.card?.id === cardId && !THROWN.includes(option.kind));
  if (!isPlayable) throw createHttpError.BadRequest("That card cannot be played");
  const card = takeFromHand(state, seat, cardId);
  toPile(state, card, seat, false);
  record(state, seat, { card, kind: "show" });
  state.shown = { seat, card };
  return state;
};

// move: { key } naming one of the plays the view offered, with { taken } as well for the red queen, or { show } putting a card down first
// a card put down waits for its choice, so the turn it opened is still going
export const isMidTurn = (state) => Boolean(state.shown);

export const play = (previous, seat, move) => {
  if (previous.winner !== null) throw createHttpError.BadRequest("This game is over");
  const state = structuredClone(previous);
  if (state.pending) return loseCard(state, seat, move);
  if (move?.show !== undefined) return showCard(state, seat, move.show);

  const chosen = turnPlays(state, seat).find((option) => keyOf(option) === move?.key);
  if (!chosen) throw createHttpError.BadRequest("That move is not allowed");
  const shownFirst = Boolean(state.shown);
  state.shown = null;
  if (!shownFirst) {
    const cards = chosen.kind === "discardAll" ? state.players[seat].hand.splice(0) : [takeFromHand(state, seat, chosen.card.id)];
    cards.forEach((card) => toPile(state, card, seat, THROWN.includes(chosen.kind)));
  }
  chosen.moves?.forEach((step) => moveMarble(state, step));
  if (chosen.kind === "swap") swapMarbles(state, chosen.swap);

  // where the taken card sat, so its owner's hand can show it leaving
  let lost = null;
  let lostAt = null;
  const victim = nextSeat(state, seat);
  if (chosen.kind === "takeCard") {
    const hand = state.players[victim].hand;
    if (!Number.isInteger(move.taken) || move.taken < 0 || move.taken >= hand.length) throw createHttpError.BadRequest("Pick one of their cards");
    lostAt = move.taken;
    [lost] = hand.splice(move.taken, 1);
    toPile(state, lost, victim, true);
  }
  if (chosen.kind === "discardOther") state.pending = { seat: victim };

  // a card shown earlier is already on the pile, so the play shows only what the card does
  const recorded = (extra = {}) => record(state, seat, chosen, { ...extra, shownFirst });
  if (hasWon(state, seat)) {
    state.winner = seat;
    return recorded();
  }
  if (state.pending) return recorded();
  // one against one, a knock-out or a marble settling in the deepest free hole of its home earns one more card, played straight away
  if (tableOf(state).combo && (knocksOut(chosen) || settlesHome(state, chosen, seat))) {
    state.players[seat].hand.push(drawCard(state));
    return recorded({ bonus: true, lost, lostAt });
  }
  // the red queen's victim loses their turn along with the card
  const turnEnds = chosen.kind === "takeCard" ? victim : seat;
  return recorded({ lost, lostAt, dealt: passTurn(state, turnEnds) });
};

// what the round's deal looks like from the table: how many cards the deck held before it, and how many each player got
const dealOf = (state) => {
  const { roundSizes } = tableOf(state);
  const roundOfDeck = (state.round - 1) % roundSizes.length;
  const dealtBefore = roundSizes.slice(0, roundOfDeck).reduce((total, size) => total + size * state.players.length, 0);
  return { left: DECK_SIZE - dealtBefore, each: roundSizes[roundOfDeck] };
};

// the seat that finished the game wins with its partner
export const outcome = (state) => (state.winner === null ? null : { winners: winnersOf(state, state.winner) });

// each move carries its path and whom it knocks out, so the client can preview it hole by hole before it is played
const optionView = (state, option, seat) => ({
  key: keyOf(option),
  card: option.card?.id ?? null,
  kind: option.kind,
  swap: option.swap ?? null,
  moves:
    option.moves?.map((move) => ({
      marble: move.marble,
      to: move.to,
      path: move.path,
      steps: move.path.length,
      captured: move.captured.map(({ marble }) => marble),
      knocksOut: move.captured.some(({ marble }) => !isPartner(state, seat, marble.owner)),
      home: isPartner(state, seat, move.marble.owner) && move.to.at === "home" && move.from.at !== "home",
    })) ?? null,
});

// the shoe and the other hand stay hidden: everyone sees the board, the pile and how many cards each player holds
export const viewFor = (state, seat) => {
  const isPlaying = Number.isInteger(seat) && seat >= 0 && seat < state.players.length;
  const toMove = turnOf(state);
  const isMyTurn = isPlaying && seat === toMove && state.winner === null;
  const options = isMyTurn ? turnPlays(state, seat) : [];
  return {
    mode: state.mode ?? "single",
    team: tableOf(state).team,
    colours: state.colours,
    turn: toMove,
    pending: state.pending,
    shown: state.shown,
    winner: state.winner,
    winners: outcome(state)?.winners ?? [],
    plays: state.plays,
    round: state.round,
    deal: dealOf(state),
    marbles: state.players.map(({ marbles }) => marbles),
    blockedHomes: seatsOf(state).filter((owner) => blockerOf(state, owner)),
    hands: state.players.map(({ hand }) => hand.length),
    hand: isPlaying ? state.players[seat].hand : [],
    pile: state.pile,
    lastPlay: state.lastPlay,
    options: options.map((option) => optionView(state, option, seat)),
  };
};
