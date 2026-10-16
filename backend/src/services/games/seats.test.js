import { test } from "node:test";
import assert from "node:assert/strict";

import {
  backToLobby,
  comeBack,
  declineInvite,
  emptySeats,
  handToBot,
  invite,
  isEveryoneReady,
  lift,
  missTurn,
  playedTurn,
  playerIndexOf,
  resized,
  setLocked,
  setReady,
  sit,
  stand,
  unreadyAll,
  vacate,
} from "#src/services/games/seats.js";

const ARIA = "aria";
const BIANCA = "bianca";
const ERIN = "erin";

const seatedAs = (...users) => users.reduce((seats, user, index) => sit(seats, index, user), emptySeats(4));

test("a free seat takes whoever sits in it, not yet ready", () => {
  const [seat] = sit(emptySeats(2), 0, ARIA);
  assert.equal(seat.user, ARIA);
  assert.equal(seat.ready, false);
});

test("a taken seat, a second seat and a seat that does not exist are all refused", () => {
  const seats = sit(emptySeats(2), 0, ARIA);
  assert.throws(() => sit(seats, 0, BIANCA), /already sitting there/);
  assert.throws(() => sit(seats, 1, ARIA), /already have a seat/);
  assert.throws(() => sit(seats, 5, BIANCA), /does not exist/);
});

test("a locked seat lets in only the person invited to it, and stays locked after", () => {
  const seats = invite(emptySeats(2), 1, BIANCA);
  assert.throws(() => sit(seats, 1, ERIN), /locked/);
  const [, seat] = sit(seats, 1, BIANCA);
  assert.equal(seat.user, BIANCA);
  assert.equal(seat.locked, true);
  assert.equal(seat.invited, undefined);
});

test("declining keeps the seat locked, and unlocking withdraws the invite", () => {
  const invited = invite(emptySeats(2), 1, BIANCA);
  assert.deepEqual(declineInvite(invited, BIANCA)[1], { ready: false, locked: true });
  assert.deepEqual(setLocked(invited, 1, false)[1], { ready: false, locked: false });
});

test("an invite needs an empty seat and someone not already seated", () => {
  const seats = seatedAs(ARIA);
  assert.throws(() => invite(seats, 0, BIANCA), /already sitting there/);
  assert.throws(() => invite(seats, 1, ARIA), /already have a seat/);
});

test("standing and lifting free the seat but keep its lock", () => {
  const locked = setLocked(seatedAs(ARIA), 0, true);
  assert.deepEqual(stand(locked, ARIA)[0], { ready: false, locked: true });
  const { seats, lifted } = lift(locked, 0);
  assert.equal(lifted, ARIA);
  assert.deepEqual(seats[0], { ready: false, locked: true });
  assert.throws(() => stand(seats, ARIA), /not sitting/);
  assert.throws(() => lift(seats, 0), /Nobody is sitting/);
});

test("leaving the room clears a seat without complaint, even if there was none", () => {
  assert.equal(vacate(seatedAs(ARIA), ARIA)[0].user, undefined);
  assert.deepEqual(vacate(emptySeats(2), ARIA), emptySeats(2));
});

test("everyone has to be ready, and there have to be enough of them", () => {
  const seats = seatedAs(ARIA, BIANCA);
  assert.equal(isEveryoneReady(setReady(seats, ARIA, true), 2), false);
  const bothReady = setReady(setReady(seats, ARIA, true), BIANCA, true);
  assert.equal(isEveryoneReady(bothReady, 2), true);
  assert.equal(isEveryoneReady(bothReady, 3), false);
  assert.equal(isEveryoneReady(unreadyAll(bothReady), 2), false);
  assert.throws(() => setReady(seats, ERIN, true), /Take a seat/);
});

test("back in the lobby, whoever left gives up their seat and nobody is ready", () => {
  const played = handToBot(setReady(seatedAs(ARIA, BIANCA), ARIA, true), BIANCA);
  const [aria, bianca] = backToLobby(played);
  assert.equal(aria.user, ARIA);
  assert.equal(aria.ready, false);
  assert.equal(bianca.user, undefined);
});

test("a different game keeps everyone it has room for, in order", () => {
  const seats = resized(seatedAs(ARIA, BIANCA, ERIN), 2);
  assert.deepEqual(seats.map((seat) => seat.user), [ARIA, BIANCA]);
  assert.equal(resized(seatedAs(ARIA), 4).length, 4);
});

test("two missed turns in a row hand the seat to the bot, and one played in between resets the count", () => {
  const once = missTurn(seatedAs(ARIA, BIANCA), 0);
  assert.equal(once[0].away, false);
  assert.equal(missTurn(playedTurn(once, 0), 0)[0].away, false);
  assert.equal(missTurn(once, 0)[0].away, true);
});

test("someone the bot covered takes their seat back, but not a seat they left", () => {
  const away = missTurn(missTurn(seatedAs(ARIA, BIANCA), 0), 0);
  assert.deepEqual(comeBack(away, ARIA)[0], { user: ARIA, ready: false, locked: false, missed: 0, away: false });
  assert.throws(() => comeBack(handToBot(seatedAs(ARIA, BIANCA), ARIA), ARIA), /not playing/);
});

test("back in the lobby nobody is still away", () => {
  const away = missTurn(missTurn(seatedAs(ARIA, BIANCA), 0), 0);
  assert.deepEqual(backToLobby(away)[0], { user: ARIA, locked: false, ready: false });
});

test("a seat left to the bot is still its player's, but they no longer play it", () => {
  const left = handToBot(seatedAs(ARIA, BIANCA), ARIA);
  assert.equal(playerIndexOf(left, ARIA), -1);
  assert.equal(playerIndexOf(left, BIANCA), 1);
});
