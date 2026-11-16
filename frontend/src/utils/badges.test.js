import { describe, expect, it } from "vitest";

import { badgeArtAt, badgeCountOf, badgesByYearAndMonth } from "@/utils/badges";

describe("badgeArtAt", () => {
  it("asks Cloudinary for twice the size a badge is drawn at", () => {
    expect(badgeArtAt("https://res.cloudinary.com/demo/image/upload/v1/Badges/tester.png", 28)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_56,h_56,c_fit,f_auto,q_auto/v1/Badges/tester.png"
    );
  });
});

describe("badgesByYearAndMonth", () => {
  const badge = (id, awardedAt) => ({ id, awardedAt });

  it("groups badges by year and month, newest first", () => {
    const years = badgesByYearAndMonth([
      badge("mic", "2025-08-05T10:00:00"),
      badge("fan", "2026-08-01T10:00:00"),
      badge("voice", "2026-01-03T10:00:00"),
      badge("fan-silver", "2026-01-02T10:00:00"),
    ]);
    expect(years.map(({ year, count }) => [year, count])).toEqual([
      [2026, 3],
      [2025, 1],
    ]);
    expect(years[0].months.map((month) => month.badges.map((held) => held.id))).toEqual([["fan"], ["voice", "fan-silver"]]);
  });

  it("gives nothing for someone with no badges", () => {
    expect(badgesByYearAndMonth([])).toEqual([]);
  });
});

describe("badgeCountOf", () => {
  it("says one badge on its own and any other number in the plural", () => {
    expect(badgeCountOf(1)).toBe("1 badge");
    expect(badgeCountOf(0)).toBe("0 badges");
    expect(badgeCountOf(4)).toBe("4 badges");
  });
});
