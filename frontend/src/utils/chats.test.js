import { isDeleted } from "@/utils/chats";

const deletedAt = "2026-10-07T10:00:00Z";

test("a chat nobody deleted is never hidden", () => {
  expect(isDeleted({ latestMessage: null })).toBe(false);
});

test("a deleted chat stays hidden while nothing new has arrived", () => {
  expect(isDeleted({ deletedAt, latestMessage: null })).toBe(true);
  expect(isDeleted({ deletedAt, latestMessage: { createdAt: "2026-10-07T09:59:00Z" } })).toBe(true);
});

test("a message after the deletion brings the chat back", () => {
  expect(isDeleted({ deletedAt, latestMessage: { createdAt: "2026-10-07T10:01:00Z" } })).toBe(false);
});
