import { test } from "node:test";
import assert from "node:assert/strict";

import {
  backToLobby,
  comeBack,
  declineInvite,
  emptySeats,
  handToBot,
  invite,
  isChosenBot,
  isEveryoneReady,
  lift,
  missTurn,
  playedTurn,
  playerIndexOf,
  resized,
  withSeatCount,
  seatBot,
  setLocked,
  setReady,
  sit,
  stand,
  unreadyAll,
  unseatBot,
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
  assert.deepEqual(
    seats.map((seat) => seat.user),
    [ARIA, BIANCA]
  );
  assert.equal(resized(seatedAs(ARIA), 4).length, 4);
});

test("the same game with another seat count keeps everyone where they sit and refuses to unseat anyone", () => {
  const seats = [{ user: ARIA }, { ready: false }, { bot: true }, { ready: false }];
  assert.deepEqual(
    withSeatCount(seats, 3).map((seat) => seat.user ?? seat.bot ?? null),
    [ARIA, null, true]
  );
  assert.equal(withSeatCount(seats, 6).length, 6);
  assert.throws(() => withSeatCount(seats, 1));
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

test("a chosen bot is always ready, so one person and a bot can start", () => {
  const seats = seatBot(sit(emptySeats(2), 0, ARIA), 1);
  assert.equal(isEveryoneReady(seats, 2), false);
  assert.equal(isEveryoneReady(setReady(seats, ARIA, true), 2), true);
  assert.equal(unreadyAll(seats)[1].ready, true);
});

test("a bot left alone when a game ends gives its seat up too", () => {
  const afterGame = backToLobby(handToBot(seatBot(sit(emptySeats(2), 0, ARIA), 1), ARIA));
  assert.deepEqual(afterGame, emptySeats(2));
});

test("bots never play each other with nobody at the table", () => {
  const seats = seatBot(seatBot(emptySeats(2), 0), 1);
  assert.equal(isEveryoneReady(seats, 2), false);
  assert.deepEqual(stand(seatBot(sit(emptySeats(2), 0, ARIA), 1), ARIA), emptySeats(2));
});

test("a bot needs a free, unlocked seat, and only a bot's seat can be emptied of one", () => {
  const seats = sit(emptySeats(2), 0, ARIA);
  assert.throws(() => seatBot(seats, 0), /already sitting there/);
  assert.throws(() => seatBot(setLocked(seats, 1, true), 1), /locked/);
  assert.throws(() => unseatBot(seats, 0), /No bot/);
  assert.deepEqual(unseatBot(seatBot(seats, 1), 1)[1], { ready: false, locked: false });
});

test("a person takes a bot's seat over, and the bot stays for the next game", () => {
  const withBot = seatBot(sit(emptySeats(2), 0, ARIA), 1);
  assert.deepEqual(sit(withBot, 1, BIANCA)[1], { user: BIANCA, ready: false, locked: false });
  assert.equal(isChosenBot(backToLobby(withBot)[1]), true);
  assert.equal(isChosenBot(handToBot(withBot, ARIA)[0]), false);
});
