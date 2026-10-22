import { rivalColoursOf, standingsOf } from "@/sections/chat/game/standings";

const rowOf = (user, game, won, drawn, played) => ({ user, game, won, drawn, played, lost: played - won - drawn });

test("only the game asked for is ranked, in the order the server sent", () => {
  const rows = [rowOf("ava", "chain-reaction", 5, 0, 6), rowOf("riya", "tic-tac-toe", 3, 1, 5), rowOf("ben", "tic-tac-toe", 1, 1, 5)];
  expect(standingsOf(rows, "tic-tac-toe").map(({ user, place }) => [user, place])).toEqual([
    ["riya", 1],
    ["ben", 2],
  ]);
});

test("players level on wins, draws and games share a place, and the next place skips past them", () => {
  const rows = [rowOf("ava", "dots-and-boxes", 4, 1, 8), rowOf("riya", "dots-and-boxes", 4, 1, 8), rowOf("ben", "dots-and-boxes", 2, 0, 8)];
  expect(standingsOf(rows, "dots-and-boxes").map(({ place }) => place)).toEqual([1, 1, 3]);
});

test("the same wins over fewer games still ranks ahead", () => {
  const rows = [rowOf("ava", "tic-tac-toe", 4, 0, 5), rowOf("riya", "tic-tac-toe", 4, 0, 9)];
  expect(standingsOf(rows, "tic-tac-toe").map(({ place }) => place)).toEqual([1, 2]);
});

test("a game nobody has finished has no standings", () => {
  expect(standingsOf([rowOf("ava", "chain-reaction", 1, 0, 1)], "tic-tac-toe")).toEqual([]);
});

test("a head to head takes the two colours the game deals two players, opposite on its wheel", () => {
  expect(rivalColoursOf(["cross", "nought"])).toEqual(["cross", "nought"]);
  expect(rivalColoursOf(["red", "orange", "green", "teal", "blue", "purple"])).toEqual(["red", "teal"]);
});
