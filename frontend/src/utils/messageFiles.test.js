import { thumbnailFileOf } from "@/utils/messageFiles";

const photo = { file: { name: "beach.jpg", kind: "image" }, attachment: { status: "ready", url: "https://files.example/1" } };

test("a photo is quoted with its own thumbnail", () => {
  expect(thumbnailFileOf(photo)?.fileName).toBe("beach.jpg");
});

test("a view-once photo never shows outside its own bubble", () => {
  expect(thumbnailFileOf({ ...photo, viewOnce: true })).toBeUndefined();
});

test("a document has no thumbnail", () => {
  expect(thumbnailFileOf({ file: { name: "notes.pdf", kind: "document" }, attachment: { status: "ready" } })).toBeUndefined();
});
