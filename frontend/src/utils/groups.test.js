import { describeEvent } from "@/utils/groups";

const chat = { users: [{ _id: "ava", firstName: "Ava" }, { _id: "riya", firstName: "Riya" }] };
const eventFrom = (sender, event) => ({ sender: { _id: sender }, event });

test("opening and closing a game each read as one line in the chat", () => {
  expect(describeEvent(eventFrom("ava", { type: "game_opened", name: "Tic-tac-toe" }), chat, "riya")).toBe("Ava started Tic-tac-toe");
  expect(describeEvent(eventFrom("riya", { type: "game_closed", name: "Tic-tac-toe" }), chat, "riya")).toBe("You closed Tic-tac-toe");
});

test("a kind of event this copy does not know still reads as a line instead of breaking the chat", () => {
  expect(describeEvent(eventFrom("ava", { type: "something_new" }), chat, "riya")).toBe("Ava changed something in this chat");
});
