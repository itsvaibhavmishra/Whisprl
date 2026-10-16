import { CloseGame, WatchGame } from "@/redux/slices/actions/gameActions";
import gameReducer, { gameStateReceived } from "@/redux/slices/gameSlice";

const CHAT = "chat-1";
const viewAt = (revision, session) => gameStateReceived({ conversationId: CHAT, revision, session });

test("an update that arrives after a newer one does not undo it", () => {
  const state = [WatchGame.pending("watch", CHAT), viewAt(2, { status: "playing" }), viewAt(1, { status: "lobby" })].reduce(gameReducer, undefined);

  expect(state.view.session.status).toBe("playing");
});

test("closing a game takes it off the screen before the server answers", () => {
  const state = [WatchGame.pending("watch", CHAT), viewAt(1, { status: "lobby" }), CloseGame.pending("close", CHAT)].reduce(gameReducer, undefined);

  expect(state.view.session).toBeNull();
  expect(state.watching).toBe(CHAT);
});
