// How long each play takes to show, so the next clock waits for it; the client's jackaroo/playback.js keeps the same numbers.
import { turnOf, turnPlays } from "#src/services/games/jackaroo/rules.js";

export const PACE = {
  card: 300,
  marbleAfterCard: 200,
  hop: 170,
  bringOut: 600,
  swirlPause: 600,
  swirlGlide: 800,
  sweepPause: 200,
  knockOut: 400,
  // SWAP shows over the pile while both marbles float across each other
  swap: 1100,
  // a card taken by the red queen flies to its owner and then onto the pile
  taken: 1200,
  // the pause after a play before the next clock, long enough to read what happened
  beat: 1200,
  // a bonus card turns up after the play, then flies into the hand
  bonus: 2100,
  // the pile clears, the deck deals one card at a time, and the first clock follows
  deal: 2900,
  // the winning home cheers and bursts into gold before the result is shown
  win: 2000,
};

const THINKING = { least: 900, most: 2600, onlyChoice: 500 };

const moveMs = (move) => {
  if (move.from.at === "base") return PACE.bringOut;
  const passed = move.captured.filter(({ step }) => step < move.path.length).length;
  const landed = move.captured.length > passed;
  return move.path.length * PACE.hop + passed * PACE.sweepPause + (move.teleport ? PACE.swirlPause + PACE.swirlGlide : 0) + (landed ? PACE.knockOut : 0);
};

const boardMs = (lastPlay) => {
  if (lastPlay.moves) return PACE.marbleAfterCard + Math.max(...lastPlay.moves.map(moveMs));
  if (lastPlay.swap) return PACE.swap;
  if (lastPlay.kind === "takeCard") return PACE.taken;
  return 0;
};

export const playOutMs = (state) => {
  const { lastPlay } = state;
  if (!lastPlay) return PACE.deal;
  // a card put down only lands on the pile, and its player can choose as soon as it has
  if (lastPlay.kind === "show") return PACE.card;
  const shown = PACE.card + boardMs(lastPlay) + (lastPlay.bonus ? PACE.bonus : PACE.beat);
  if (state.winner !== null) return shown + PACE.win;
  return lastPlay.dealt ? shown + PACE.deal : shown;
};

export const thinkMs = (state) => {
  const choices = turnPlays(state, turnOf(state));
  // a card already put down is weighed like any choice, so a red queen's pick is not snatched the moment its cards are out
  if (choices.length <= 1 && !state.shown) return THINKING.onlyChoice;
  return THINKING.least + Math.random() * (THINKING.most - THINKING.least);
};
