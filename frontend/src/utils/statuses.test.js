import { ageOf, backgroundOf, groupByOwner, isLive, reactionsOf, TEXT_BACKGROUNDS, topReactions } from "@/utils/statuses";

const statusOf = (ownerId, createdAt, isViewed = false) => ({ _id: `${ownerId}-${createdAt}`, owner: { _id: ownerId }, createdAt, isViewed });

test("each person's statuses stay together, with whoever posted last first", () => {
  const groups = groupByOwner([statusOf("ana", "2026-10-06T08:00Z"), statusOf("ben", "2026-10-06T09:00Z"), statusOf("ana", "2026-10-06T10:00Z")]);

  expect(groups.map((group) => group.owner._id)).toEqual(["ana", "ben"]);
  expect(groups[0].statuses.map((status) => status.createdAt)).toEqual(["2026-10-06T08:00Z", "2026-10-06T10:00Z"]);
});

test("a person counts as seen only once every status of theirs is", () => {
  const [group] = groupByOwner([statusOf("ana", "2026-10-06T08:00Z", true), statusOf("ana", "2026-10-06T09:00Z")]);
  expect(group.hasUnseen).toBe(true);
});

test("a status is gone once its time is up", () => {
  const now = Date.parse("2026-10-06T12:00Z");
  expect(isLive({ expiresAt: "2026-10-06T12:01Z" }, now)).toBe(true);
  expect(isLive({ expiresAt: "2026-10-06T11:59Z" }, now)).toBe(false);
});

test("a background the palette does not have falls back to its first", () => {
  expect(backgroundOf(2)).toBe(TEXT_BACKGROUNDS[2]);
  expect(backgroundOf("url(evil)")).toBe(TEXT_BACKGROUNDS[0]);
});

test("an update's age reads in minutes, then hours", () => {
  const now = Date.parse("2026-10-06T12:00Z");
  expect(ageOf("2026-10-06T11:59:30Z", now)).toBe("Just now");
  expect(ageOf("2026-10-06T11:35Z", now)).toBe("25m ago");
  expect(ageOf("2026-10-06T07:00Z", now)).toBe("5h ago");
  expect(ageOf("2026-10-05T11:00Z", now)).toBe("Yesterday");
});

test("the reactions summary shows each emoji once, up to three", () => {
  const reactions = reactionsOf([{ reaction: "❤️" }, {}, { reaction: "❤️" }, { reaction: "🔥" }, { reaction: "😂" }, { reaction: "👏" }]);
  expect(reactions).toHaveLength(5);
  expect(topReactions(reactions)).toBe("❤️🔥😂");
});
