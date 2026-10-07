import { displayItemsOf, keyOf } from "@/sections/chat/conversation/displayItems";

const me = { _id: "me" };

const photo = (id, batchIndex, extra = {}) => ({
  _id: id,
  sender: me,
  batchId: "send-1",
  batchIndex,
  message: batchIndex === 0 ? "caption" : "",
  file: { name: `${id}.jpg`, kind: "image" },
  attachment: { status: "ready" },
  ...extra,
});

const deleted = (message) => ({ ...message, file: undefined, attachment: undefined, message: undefined, deletedAt: "2026-10-07T10:00:00Z" });

const groupHearts = { "send-1:me": [{ user: "them", emoji: "❤️" }] };

const shapeOf = (messages, albumReactions) =>
  displayItemsOf(messages, [], me, albumReactions).map((item) => (item.members ? item.members.map((member) => member._id) : item.message._id));

test("photos sent together show as one group", () => {
  expect(shapeOf([photo("a", 0), photo("b", 1), photo("c", 2)])).toEqual([["a", "b", "c"]]);
});

test("a photo deleted from the middle leaves the group and stands after it", () => {
  expect(shapeOf([photo("a", 0), deleted(photo("b", 1)), photo("c", 2)])).toEqual([["a", "c"], "b"]);
});

test("a deleted first photo stands before the rest of the group, which the next photo leads", () => {
  const messages = [deleted(photo("a", 0)), photo("b", 1), photo("c", 2)];
  expect(shapeOf(messages)).toEqual(["a", ["b", "c"]]);
  expect(displayItemsOf(messages, [], me)[1].message.deletedAt).toBeUndefined();
});

test("one photo left of a group shows on its own", () => {
  expect(shapeOf([photo("a", 0), deleted(photo("b", 1))])).toEqual(["a", "b"]);
});

test("documents sent together each stand alone", () => {
  const documents = [0, 1].map((index) => photo(`d${index}`, index, { file: { name: "notes.pdf", kind: "document" } }));
  expect(shapeOf(documents)).toEqual(["d0", "d1"]);
});

test("another person's photos never join the group", () => {
  expect(shapeOf([photo("a", 0), photo("b", 1, { sender: { _id: "them" } })])).toEqual(["a", "b"]);
});

test("one photo left of a group stays a group while the group has reactions of its own", () => {
  expect(shapeOf([photo("a", 0), deleted(photo("b", 1))], groupHearts)).toEqual([["a"], "b"]);
});

test("the bubble counts the group's own reactions and each photo's, knowing which is which", () => {
  const [group] = displayItemsOf([photo("a", 0, { reactions: [{ user: "them", emoji: "😂" }] }), photo("b", 1)], [], me, groupHearts);
  expect(group.message.reactions).toEqual([
    { user: "them", emoji: "❤️", isForAlbum: true },
    { user: "them", emoji: "😂", message: expect.objectContaining({ _id: "a" }) },
  ]);
});

test("a group keeps its own reactions whichever of its photos are no longer shown", () => {
  expect(displayItemsOf([photo("b", 1), photo("c", 2)], [], me, groupHearts)[0].message.albumReactions).toEqual(groupHearts["send-1:me"]);
});

test("a group keeps its key when the photo leading it goes", () => {
  const before = displayItemsOf([photo("a", 0), photo("b", 1), photo("c", 2)], [], me)[0];
  const after = displayItemsOf([deleted(photo("a", 0)), photo("b", 1), photo("c", 2)], [], me)[1];
  expect(keyOf(after.message)).toBe(keyOf(before.message));
});

test("a group split by someone else's message keeps two different keys", () => {
  const items = displayItemsOf([photo("a", 0), photo("b", 1), { _id: "theirs", sender: { _id: "them" }, message: "hi" }, photo("c", 2), photo("d", 3)], [], me);
  expect(new Set(items.map((item) => keyOf(item.message))).size).toBe(3);
});
