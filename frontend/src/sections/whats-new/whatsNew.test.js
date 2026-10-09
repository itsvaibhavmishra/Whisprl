import { releaseNote, releaseTitle, unseenReleaseFor } from "@/sections/whats-new/whatsNew";

const release = { version: "2.1.0", date: "2026-10-20", highlights: [] };
const older = { whatsNewSeen: "2.0.0", createdAt: "2026-01-01T10:00:00Z" };

test("a release shows once to an account that was here before it", () => {
  expect(unseenReleaseFor(older, [release])).toBe(release);
  expect(unseenReleaseFor({ ...older, whatsNewSeen: "2.1.0" }, [release])).toBeNull();
});

test("an account made after a release never sees it", () => {
  expect(unseenReleaseFor({ createdAt: "2026-10-21T10:00:00Z" }, [release])).toBeNull();
});

test("nothing shows when there is no release, and a preview shows to everyone until seen", () => {
  expect(unseenReleaseFor(older, [])).toBeNull();
  const preview = { version: "next", date: null, highlights: [] };
  expect(unseenReleaseFor({ createdAt: "2026-10-21T10:00:00Z" }, [preview])).toBe(preview);
  expect(unseenReleaseFor({ whatsNewSeen: "next" }, [preview])).toBeNull();
});

test("a release is named by its version and dated, and a preview says it is one", () => {
  expect(releaseTitle(release)).toBe("Whisprl 2.1.0");
  expect(releaseNote(release)).toMatch(/^Released .*2026/);
  expect(releaseTitle({ version: "next", date: null })).toBe("Preview of the next release");
  expect(releaseNote({ version: "next", date: null })).toBe("Only development builds show this");
});
