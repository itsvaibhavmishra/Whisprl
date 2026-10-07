import { holdReaction, withHeldReaction } from "@/utils/heldReactions";

const echoed = [{ user: "them", emoji: "😂" }];

test("an echo leaves your reaction alone while its request is out", () => {
  const release = holdReaction("message-1", "❤️");
  expect(withHeldReaction("message-1", echoed, "me")).toEqual([{ user: "them", emoji: "😂" }, { user: "me", emoji: "❤️" }]);
  release();
  expect(withHeldReaction("message-1", echoed, "me")).toBe(echoed);
});

test("a reaction being taken back stays gone from an echo that still has it", () => {
  const release = holdReaction("message-1", null);
  expect(withHeldReaction("message-1", [...echoed, { user: "me", emoji: "❤️" }], "me")).toEqual(echoed);
  release();
});

test("an older request finishing does not drop a newer one's hold", () => {
  const releaseOlder = holdReaction("send-1:bob", "😮");
  const releaseNewer = holdReaction("send-1:bob", "🙏");
  releaseOlder();
  expect(withHeldReaction("send-1:bob", [], "me")).toEqual([{ user: "me", emoji: "🙏" }]);
  releaseNewer();
  expect(withHeldReaction("send-1:bob", [], "me")).toEqual([]);
});
