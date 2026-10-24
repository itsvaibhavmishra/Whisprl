import { recentEmoji, rememberEmoji, savedSkinTone, saveSkinTone } from "@/components/emoji-picker/emojiPreferences";

beforeEach(() => localStorage.clear());

describe("rememberEmoji", () => {
  it("puts the latest emoji first without repeating it", () => {
    rememberEmoji("😂");
    rememberEmoji("👍");
    expect(rememberEmoji("😂")).toEqual(["😂", "👍"]);
    expect(recentEmoji()).toEqual(["😂", "👍"]);
  });

  it("keeps only the most recent two dozen", () => {
    Array.from({ length: 30 }, (_, index) => rememberEmoji(String(index)));
    expect(recentEmoji()).toHaveLength(24);
    expect(recentEmoji()[0]).toBe("29");
  });

  it("starts empty when what is stored is not a list", () => {
    localStorage.setItem("whisprl-recent-emoji", "{");
    expect(recentEmoji()).toEqual([]);
  });
});

describe("skin tone", () => {
  it("has none until one is chosen, then keeps it", () => {
    expect(savedSkinTone()).toBe("none");
    saveSkinTone("medium");
    expect(savedSkinTone()).toBe("medium");
  });
});
