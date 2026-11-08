import { render, screen, waitFor } from "@testing-library/react";

import EvidenceTranscript from "@/sections/admin/EvidenceTranscript";

const blobs = [];

beforeEach(() => {
  blobs.length = 0;
  globalThis.fetch = async () => new Response("<script>document.title = 'ran'</script>");
  URL.createObjectURL = (blob) => {
    blobs.push(blob);
    return `blob:http://localhost:3200/evidence-${blobs.length}`;
  };
});

const entryWith = (file) => [{ sentAt: "2026-11-05T10:00:00Z", check: "unchecked", text: "see attached", files: [file] }];

test("a file of any type but our own media is offered only as a download of plain bytes", async () => {
  render(<EvidenceTranscript evidence={entryWith({ url: "https://res.cloudinary.com/x/raw/upload/page", mimeType: "text/html" })} />);
  const link = await waitFor(() => screen.getByText("Download the file"));
  expect(link.getAttribute("download")).toBe("evidence");
  expect(blobs[0].type).toBe("application/octet-stream");
});

test("a named document keeps its name for the download", async () => {
  render(<EvidenceTranscript evidence={entryWith({ url: "https://res.cloudinary.com/x/raw/upload/doc", mimeType: "application/pdf", name: "notes.pdf" })} />);
  const link = await waitFor(() => screen.getByText("notes.pdf"));
  expect(link.getAttribute("download")).toBe("notes.pdf");
});

test("a photo is shown in place with its own type", async () => {
  render(<EvidenceTranscript evidence={entryWith({ url: "https://res.cloudinary.com/x/image/upload/photo", mimeType: "image/jpeg", name: "photo.jpg" })} />);
  const photo = await waitFor(() => screen.getByAltText("photo.jpg"));
  expect(photo.tagName).toBe("IMG");
  expect(blobs[0].type).toBe("image/jpeg");
});

test("an image type we never send, like SVG, is not shown in place", async () => {
  render(<EvidenceTranscript evidence={entryWith({ url: "https://res.cloudinary.com/x/raw/upload/drawing", mimeType: "image/svg+xml" })} />);
  const link = await waitFor(() => screen.getByText("Download the file"));
  expect(link.hasAttribute("download")).toBe(true);
  expect(blobs[0].type).toBe("application/octet-stream");
});
