import { act, renderHook } from "@testing-library/react";

import { playGameSound } from "@/sections/chat/game/gameSounds";
import useGameSounds from "@/sections/chat/game/useGameSounds";
import { feel, TAP } from "@/utils/haptics";

jest.mock("@/sections/chat/game/gameSounds", () => ({ playGameSound: jest.fn() }));
jest.mock("@/utils/haptics", () => ({ ...jest.requireActual("@/utils/haptics"), feel: jest.fn() }));

const ME = "me";
const PEER = "peer";
const seats = [{ user: ME }, { user: PEER }];
const board = (...marks) => [...marks, ...Array(9 - marks.length).fill(null)];
const playing = (turn, marks) => ({ game: "tic-tac-toe", status: "playing", seats, turn, state: { board: marks } });

const heardAfter = (...sessions) => {
  const { rerender } = renderHook(({ session }) => useGameSounds(session, ME), { initialProps: { session: sessions[0] } });
  sessions.slice(1).forEach((session) => rerender({ session }));
  act(() => jest.runOnlyPendingTimers());
  return playGameSound.mock.calls.map(([name]) => name);
};

beforeEach(() => {
  jest.useFakeTimers();
  playGameSound.mockClear();
});
afterEach(() => jest.useRealTimers());

test("a game starting, a move landing and the turn coming back each sound once", () => {
  const lobby = { game: "tic-tac-toe", status: "lobby", seats, state: null };
  expect(heardAfter(lobby, playing(0, board()), playing(1, board(0)), playing(0, board(0, 1)))).toEqual(["start", "chalk", "chalk", "yourTurn"]);
});

test("the same view arriving again, as after a reconnect, stays quiet", () => {
  expect(heardAfter(playing(1, board(0)), playing(1, board(0)))).toEqual([]);
});

test("the last move of a game is followed by how it ended for this person", () => {
  const won = { game: "tic-tac-toe", status: "lobby", seats, state: { board: board(0, 1, 0, 1, 0, 1, 0) }, result: { winners: [{ user: ME, bot: false }] } };
  expect(heardAfter(playing(0, board(0, 1, 0, 1, 0, 1)), won)).toEqual(["chalk", "won"]);
});

test("a game that sounds its own moments is felt but not heard from the room", () => {
  const dealt = (turn, plays) => ({ game: "jackaroo", status: "playing", seats, turn, state: { plays } });
  feel.mockClear();
  expect(heardAfter(dealt(1, 0), dealt(0, 1))).toEqual([]);
  expect(feel).toHaveBeenCalledWith(TAP);
});
