import { forgetChats, readSavedChats, restoredFrom, saveChats, snapshotOf } from "@/utils/savedChats";

const stored = new Map();

vi.mock("@/utils/crypto/keyStore", () => ({
  loadSavedChats: async (userId) => stored.get(userId),
  saveSavedChats: async (userId, saved) => stored.set(userId, saved),
  forgetSavedChats: async (userId) => stored.delete(userId),
}));

const messageOf = (number, extra = {}) => ({ _id: `m${String(number).padStart(3, "0")}`, text: `secret ${number}`, ...extra });

const chatState = (overrides = {}) => ({
  conversations: [{ _id: "c1", arrival: 7, latestMessage: messageOf(2) }],
  cache: { c2: { messages: [messageOf(1)], hasOlderMessages: false, hasNewerMessages: false } },
  activeConversation: { _id: "c1" },
  messages: [messageOf(1), messageOf(2)],
  albumReactions: {},
  ...overrides,
});

beforeEach(() => stored.clear());

describe("snapshotOf", () => {
  it("keeps the list and every held chat, the open one included", () => {
    const snapshot = snapshotOf(chatState());
    expect(Object.keys(snapshot.chats).sort()).toEqual(["c1", "c2"]);
    expect(snapshot.chats.c1.map((message) => message._id)).toEqual(["m001", "m002"]);
  });

  it("leaves behind how recently a chat was reached, which counts only within one launch", () => {
    expect(snapshotOf(chatState()).conversations[0]).not.toHaveProperty("arrival");
  });

  it("keeps only a chat's newest page", () => {
    const messages = Array.from({ length: 80 }, (_, index) => messageOf(index));
    const saved = snapshotOf(chatState({ messages })).chats.c1;
    expect(saved).toHaveLength(60);
    expect(saved.at(-1)._id).toBe("m079");
  });
});

describe("restoredFrom", () => {
  it("marks every saved message, so a fresh page replaces them", () => {
    const restored = restoredFrom(snapshotOf(chatState()));
    expect(restored.cache.c1.messages.every((message) => message.isSaved)).toBe(true);
  });

  it("leaves out messages that disappeared while the app was closed", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const snapshot = snapshotOf(chatState({ messages: [messageOf(1), messageOf(2, { expiresAt: past })] }));
    snapshot.conversations[0].latestMessage = messageOf(2, { expiresAt: past });
    const restored = restoredFrom(snapshot);
    expect(restored.cache.c1.messages.map((message) => message._id)).toEqual(["m001"]);
    expect(restored.conversations[0].latestMessage).toBeNull();
  });
});

describe("saving", () => {
  it("reads back what it saved, without the text ever being stored readable", async () => {
    const snapshot = snapshotOf(chatState());
    await saveChats("ava", snapshot);
    const savedBytes = new TextDecoder().decode(stored.get("ava").data);
    expect(savedBytes).not.toContain("secret");
    expect(await readSavedChats("ava")).toEqual(snapshot);
  });

  it("never lands a save that a sign-out overtook", async () => {
    const saving = saveChats("ava", snapshotOf(chatState()));
    await forgetChats("ava");
    await saving;
    expect(stored.has("ava")).toBe(false);
  });

  it("drops a saved copy it cannot read", async () => {
    await saveChats("ava", snapshotOf(chatState()));
    stored.get("ava").data = new Uint8Array([1, 2, 3]).buffer;
    expect(await readSavedChats("ava")).toBeNull();
    expect(stored.has("ava")).toBe(false);
  });
});
