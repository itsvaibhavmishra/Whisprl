import uuidv4 from "@/utils/uuidv4";

// the same lists the server accepts, so nothing is picked here only to be refused after uploading
export const ATTACHMENT_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/zip",
    "application/x-rar-compressed",
  ],
};

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const LONG_EDGE = 1600;
const PHOTO_QUALITY = 0.8;

const canvasBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY));

// a phone photo shrinks about tenfold and looks the same in a chat; a GIF keeps its animation
export const shrinkImage = async (file) => {
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  // a JPEG has no transparency, and the clear parts of a PNG would otherwise turn black
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const shrunk = await canvasBlob(canvas);
  if (!shrunk || shrunk.size >= file.size) return file;
  return new File([shrunk], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg", lastModified: file.lastModified });
};

// fetched rather than linked, because a browser ignores the name a link suggests for a file on another site
export const downloadFile = async (url, fileName) => {
  const blob = await (await fetch(url)).blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

// File objects and their preview URLs cannot live in the store, so they wait here under an id the store keeps
const held = new Map();

export const holdAttachment = (file) => {
  const id = uuidv4();
  held.set(id, { file, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null });
  return id;
};

export const attachmentFile = (id) => held.get(id)?.file;

export const attachmentPreview = (id) => held.get(id)?.previewUrl ?? null;

export const releaseAttachment = (id) => {
  const attachment = held.get(id);
  if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
  held.delete(id);
};

export const releaseAllAttachments = () => [...held.keys()].forEach(releaseAttachment);

export const pickFiles = (accept) =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = accept.join(",");
    input.addEventListener("change", () => resolve(Array.from(input.files)));
    input.click();
  });
