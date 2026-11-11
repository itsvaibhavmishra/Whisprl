import { keyChangesOf } from "@/utils/crypto/keyChanges";

const direct = (id, sender, keyIds) => ({ _id: id, sender: { _id: sender }, cipher: { keyIds } });
const group = (id, sender, senderKeyId) => ({ _id: id, sender: { _id: sender }, cipher: { senderKeyId, keys: [] } });

describe("keyChangesOf", () => {
  it("marks the first message after a friend's key changes", () => {
    const messages = [direct("1", "leo", ["leo-a", "me-a"]), direct("2", "me", ["me-a", "leo-a"]), direct("3", "leo", ["leo-b", "me-a"])];
    expect([...keyChangesOf(messages, "me", "leo")]).toEqual([["3", ["leo"]]]);
  });

  it("notices the change from a message you sealed to their new key", () => {
    const messages = [direct("1", "leo", ["leo-a", "me-a"]), direct("2", "me", ["me-a", "leo-b"])];
    expect([...keyChangesOf(messages, "me", "leo")]).toEqual([["2", ["leo"]]]);
  });

  it("says nothing when only your own key changed", () => {
    const messages = [direct("1", "me", ["me-a", "leo-a"]), direct("2", "me", ["me-b", "leo-a"])];
    expect(keyChangesOf(messages, "me", "leo").size).toBe(0);
  });

  it("ignores a message sealed back to you for a friend with no key yet", () => {
    const messages = [direct("1", "me", ["me-a", "me-a"]), direct("2", "leo", ["leo-a", "me-a"])];
    expect(keyChangesOf(messages, "me", "leo").size).toBe(0);
  });

  it("tracks each member of a group by their own messages", () => {
    const messages = [group("1", "leo", "leo-a"), group("2", "mei", "mei-a"), group("3", "leo", "leo-a"), group("4", "mei", "mei-b")];
    expect([...keyChangesOf(messages, "me")]).toEqual([["4", ["mei"]]]);
  });

  it("skips messages without encryption", () => {
    const messages = [{ _id: "1", sender: { _id: "leo" }, message: "hi" }, direct("2", "leo", ["leo-a", "me-a"])];
    expect(keyChangesOf(messages, "me", "leo").size).toBe(0);
  });
});
