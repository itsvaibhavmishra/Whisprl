import { CloseGame, WatchGame } from "@/redux/slices/actions/gameActions";
import gameReducer, { gameCollapsed, gameStateReceived, lookersChanged, selectGameOnScreen } from "@/redux/slices/gameSlice";

const CHAT = "chat-1";
const viewAt = (revision, session) => gameStateReceived({ conversationId: CHAT, revision, session });

test("an update that arrives after a newer one does not undo it", () => {
  const state = [WatchGame.pending("watch", CHAT), viewAt(2, { status: "playing" }), viewAt(1, { status: "lobby" })].reduce(gameReducer, undefined);

  expect(state.view.session.status).toBe("playing");
});

test("a view is stamped with when it arrived, so waits the server sends count from then", () => {
  const before = Date.now();
  const state = [WatchGame.pending("watch", CHAT), viewAt(1, { status: "playing", turnStartsIn: 2500 })].reduce(gameReducer, undefined);

  expect(state.view.receivedAt).toBeGreaterThanOrEqual(before);
  expect(state.view.receivedAt).toBeLessThanOrEqual(Date.now());
});

test("closing a game takes it off the screen before the server answers", () => {
  const state = [WatchGame.pending("watch", CHAT), viewAt(1, { status: "lobby" }), CloseGame.pending("close", CHAT)].reduce(gameReducer, undefined);

  expect(state.view.session).toBeNull();
  expect(state.watching).toBe(CHAT);
});

test("who has the game on screen comes with each view and with each change, for the chat being watched only", () => {
  const watched = [WatchGame.pending("watch", CHAT), gameStateReceived({ conversationId: CHAT, revision: 1, session: null, lookers: ["ava"] })].reduce(
    gameReducer,
    undefined
  );
  expect(watched.lookers).toEqual(["ava"]);
  expect(gameReducer(watched, lookersChanged({ conversationId: CHAT, users: ["ava", "ben"] })).lookers).toEqual(["ava", "ben"]);
  expect(gameReducer(watched, lookersChanged({ conversationId: "elsewhere", users: [] })).lookers).toEqual(["ava"]);
});

test("a game counts as on screen until it is minimised", () => {
  const playing = [WatchGame.pending("watch", CHAT), viewAt(1, { game: "tic-tac-toe", status: "playing" })].reduce(gameReducer, undefined);
  expect(selectGameOnScreen({ game: playing }, CHAT)).toBe("tic-tac-toe");
  expect(selectGameOnScreen({ game: playing }, "elsewhere")).toBeNull();
  expect(selectGameOnScreen({ game: gameReducer(playing, gameCollapsed(true)) }, CHAT)).toBeNull();
});
