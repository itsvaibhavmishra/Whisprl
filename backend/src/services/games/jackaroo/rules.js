import createHttpError from "http-errors";

import { coloursFor } from "#src/services/games/colours.js";
import { MARBLES, START } from "#src/services/games/jackaroo/board.js";
import { newDeck, shuffled } from "#src/services/games/jackaroo/cards.js";
import { keyOf, knocksOut, losingPlays, moveMarble, other, placeOf, playsForTurn, settlesHome } from "#src/services/games/jackaroo/moves.js";

// each deck is dealt over three rounds of these sizes, then a fresh one comes in
const ROUND_SIZES = [4, 4, 5];
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

const dealRound = (state) => {
  const roundOfDeck = state.round % ROUND_SIZES.length;
  if (roundOfDeck === 0) openDeck(state);
  for (let card = 0; card < ROUND_SIZES[roundOfDeck]; card += 1) {
    for (const seat of [state.leader, other(state.leader)]) state.players[seat].hand.push(drawCard(state));
  }
  state.round += 1;
};

const startingMarbles = (seat) => Array.from({ length: MARBLES }, (_, slot) => (slot === 0 ? { at: "track", index: START[seat] } : { at: "base", slot }));

export const setup = (previous, { players = 2, seating = null } = {}) => {
  // a coin decides who opens the first game, and the opener alternates after that
  const first = previous ? other(previous.first) : Number(Math.random() < 0.5);
  const state = {
    seating,
    colours: coloursFor(previous, players, seating),
    players: [0, 1].map((seat) => ({ hand: [], marbles: startingMarbles(seat) })),
    shoe: [],
    decks: 0,
    pile: [],
    first,
    // who leads every round of the current deck; the lead passes across with each new deck
    leader: first,
    turn: first,
    round: 0,
    // a ten used on the other player makes it their turn until they choose the card they lose
    pending: null,
    winner: null,
    plays: 0,
    lastPlay: null,
  };
  dealRound(state);
  return state;
};

export const turnOf = (state) => state.pending?.seat ?? state.turn;

// once seat's turn is over the turn goes across, stays with whoever still holds cards, and a new round comes when neither does
const passTurn = (state, seat) => {
  if (state.players[other(seat)].hand.length) state.turn = other(seat);
  else if (state.players[seat].hand.length) state.turn = seat;
  else {
    if (state.round % ROUND_SIZES.length === 0) state.leader = other(state.leader);
    state.turn = state.leader;
    dealRound(state);
    return true;
  }
  return false;
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

const hasWon = (state, seat) => state.players[seat].marbles.every((place) => place.at === "home");

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

// move: { key } naming one of the plays the view offered, with { taken } as well for the red queen
export const play = (previous, seat, move) => {
  if (previous.winner !== null) throw createHttpError.BadRequest("This game is over");
  const state = structuredClone(previous);
  if (state.pending) return loseCard(state, seat, move);

  const chosen = playsForTurn(state, seat).find((option) => keyOf(option) === move?.key);
  if (!chosen) throw createHttpError.BadRequest("That move is not allowed");
  const cards = chosen.kind === "discardAll" ? state.players[seat].hand.splice(0) : [takeFromHand(state, seat, chosen.card.id)];
  cards.forEach((card) => toPile(state, card, seat, THROWN.includes(chosen.kind)));
  chosen.moves?.forEach((step) => moveMarble(state, step));
  if (chosen.kind === "swap") swapMarbles(state, chosen.swap);

  // where the taken card sat, so its owner's hand can show it leaving
  let lost = null;
  let lostAt = null;
  if (chosen.kind === "takeCard") {
    const hand = state.players[other(seat)].hand;
    if (!Number.isInteger(move.taken) || move.taken < 0 || move.taken >= hand.length) throw createHttpError.BadRequest("Pick one of their cards");
    lostAt = move.taken;
    [lost] = hand.splice(move.taken, 1);
    toPile(state, lost, other(seat), true);
  }
  if (chosen.kind === "discardOther") state.pending = { seat: other(seat) };

  if (hasWon(state, seat)) {
    state.winner = seat;
    return record(state, seat, chosen);
  }
  if (state.pending) return record(state, seat, chosen);
  // a knock-out or a marble settling in the deepest free hole of its home earns one more card, played straight away
  if (knocksOut(chosen) || settlesHome(state, chosen, seat)) {
    state.players[seat].hand.push(drawCard(state));
    return record(state, seat, chosen, { bonus: true, lost, lostAt });
  }
  // the red queen's victim loses their turn along with the card
  const turnEnds = chosen.kind === "takeCard" ? other(seat) : seat;
  return record(state, seat, chosen, { lost, lostAt, dealt: passTurn(state, turnEnds) });
};

// what the round's deal looks like from the table: how many cards the deck held before it, and how many each player got
const dealOf = (state) => {
  const roundOfDeck = (state.round - 1) % ROUND_SIZES.length;
  const dealtBefore = ROUND_SIZES.slice(0, roundOfDeck).reduce((total, size) => total + size * 2, 0);
  return { left: DECK_SIZE - dealtBefore, each: ROUND_SIZES[roundOfDeck] };
};

export const outcome = (state) => (state.winner === null ? null : { winners: [state.winner] });

// each move carries its path and whom it knocks out, so the client can preview it hole by hole before it is played
const optionView = (option, seat) => ({
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
      knocksOut: move.captured.some(({ marble }) => marble.owner !== seat),
      home: move.marble.owner === seat && move.to.at === "home" && move.from.at !== "home",
    })) ?? null,
});

// the shoe and the other hand stay hidden: everyone sees the board, the pile and how many cards each player holds
export const viewFor = (state, seat) => {
  const isPlaying = seat === 0 || seat === 1;
  const toMove = turnOf(state);
  const isMyTurn = isPlaying && seat === toMove && state.winner === null;
  const options = isMyTurn ? (state.pending ? losingPlays(state, seat) : playsForTurn(state, seat)) : [];
  return {
    colours: state.colours,
    turn: toMove,
    pending: state.pending,
    winner: state.winner,
    plays: state.plays,
    round: state.round,
    deal: dealOf(state),
    marbles: state.players.map(({ marbles }) => marbles),
    hands: state.players.map(({ hand }) => hand.length),
    hand: isPlaying ? state.players[seat].hand : [],
    pile: state.pile,
    lastPlay: state.lastPlay,
    options: options.map((option) => optionView(option, seat)),
  };
};
