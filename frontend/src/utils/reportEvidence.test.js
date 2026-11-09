import { evidenceAround } from "@/utils/reportEvidence";

const message = (id, extra) => ({ _id: id, sender: "u1", createdAt: "2026-11-05T10:00:00Z", message: "hi", plaintext: "hi", ...extra });

test("an encrypted attachment goes with its address, key and file name", () => {
  const sent = message("m1", {
    file: { name: "photo.jpg", kind: "image", mimeType: "image/jpeg", key: "k", iv: "i" },
    attachment: { url: "https://res.cloudinary.com/x/raw/upload/a", status: "ready" },
  });
  expect(evidenceAround([sent], "m1")[0].files).toEqual([
    { url: "https://res.cloudinary.com/x/raw/upload/a", key: "k", iv: "i", mimeType: "image/jpeg", name: "photo.jpg" },
  ]);
});

test("an older plain file goes with its own address and name", () => {
  const sent = message("m1", {
    files: [{ url: "https://res.cloudinary.com/x/image/upload/b.jpg", fileName: "b.jpg", fileType: "image", mimeType: "image/jpeg" }],
  });
  expect(evidenceAround([sent], "m1")[0].files).toEqual([
    { url: "https://res.cloudinary.com/x/image/upload/b.jpg", key: undefined, iv: undefined, mimeType: "image/jpeg", name: "b.jpg" },
  ]);
});

test("an attachment still uploading has no address yet, so it is left out", () => {
  const sent = message("m1", { file: { name: "c.jpg", mimeType: "image/jpeg" }, attachment: { status: "uploading" } });
  expect(evidenceAround([sent], "m1")[0].files).toEqual([]);
});
