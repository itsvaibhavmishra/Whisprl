import { releaseNote, releaseTitle } from "@/sections/whats-new/whatsNew";

const release = { version: "2.1.0", date: "2026-10-20", highlights: [] };

test("a release is named by its version and dated, and a preview says it is one", () => {
  expect(releaseTitle(release)).toBe("Whisprl 2.1.0");
  expect(releaseNote(release)).toMatch(/^Released .*2026/);
  expect(releaseTitle({ version: "next", date: null })).toBe("Preview of the next release");
  expect(releaseNote({ version: "next", date: null })).toBe("Only development builds show this");
});
