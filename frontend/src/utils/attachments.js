import { openFile } from "@/utils/crypto/fileCipher";
import uuidv4 from "@/utils/uuidv4";

// checked only here, since the server receives every file encrypted and cannot tell what it is
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const ATTACHMENT_TYPES = {
  media: [...IMAGE_TYPES, ...VIDEO_TYPES],
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
const PREVIEW_EDGE = 24;
const PHOTO_QUALITY = 0.8;
const PREVIEW_QUALITY = 0.5;

const drawWithin = (bitmap, longEdge) => {
  const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  // a JPEG has no transparency, and the clear parts of a PNG would otherwise turn black
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
};

const shrink = async (bitmap, file) => {
  if (file.type === "image/gif") return file;
  const shrunk = await new Promise((resolve) => drawWithin(bitmap, LONG_EDGE).toBlob(resolve, "image/jpeg", PHOTO_QUALITY));
  if (!shrunk || shrunk.size >= file.size) return file;
  return new File([shrunk], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg", lastModified: file.lastModified });
};

export const prepareImage = async (file) => {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { file };

  const { width, height } = bitmap;
  const preview = drawWithin(bitmap, PREVIEW_EDGE).toDataURL("image/jpeg", PREVIEW_QUALITY);
  const photo = await shrink(bitmap, file);
  bitmap.close();
  return { file: photo, width, height, preview };
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

// this browser's own files wait here, outside the store, under the id their message is sent with
const held = new Map();

export const holdAttachment = (file) => {
  const id = uuidv4();
  held.set(id, { file, url: URL.createObjectURL(file) });
  return id;
};

export const attachmentFile = (id) => held.get(id)?.file;

export const replaceHeldFile = (id, file) => {
  const attachment = held.get(id);
  URL.revokeObjectURL(attachment.url);
  Object.assign(attachment, { file, url: URL.createObjectURL(file) });
};

// each step of a send replaces the one before, so its bubble stops whichever is running and a stale step knows it is stale
export const startTransfer = (id) => {
  const controller = new AbortController();
  if (held.has(id)) held.get(id).transfer = controller;
  return controller;
};

export const isCurrentTransfer = (id, controller) => held.get(id)?.transfer === controller;

export const cancelTransfer = (id) => {
  const controller = held.get(id)?.transfer;
  if (!controller || controller.signal.aborted) return false;
  controller.abort();
  return true;
};

// only whole steps are reported, so a fast encoder does not flood the store
export const wholePercents = (onPercent) => {
  let shown = -1;
  return (percent) => {
    const whole = Math.floor(percent);
    if (whole === shown) return;
    shown = whole;
    onPercent(whole);
  };
};

export const attachmentUrl = (id) => held.get(id)?.url ?? null;

export const keepSealedCopy = (id, data) => {
  held.get(id).sealed = new Blob([data]);
};

export const sealedCopyOf = (id) => held.get(id)?.sealed ?? null;

export const dropSealedCopy = (id) => {
  if (held.has(id)) delete held.get(id).sealed;
};

export const markAttachmentSent = (id, messageId) => {
  held.get(id).messageId = messageId;
};

export const sentMessageIdOf = (id) => held.get(id)?.messageId ?? null;

export const releaseAttachment = (id) => {
  const attachment = held.get(id);
  if (attachment) URL.revokeObjectURL(attachment.url);
  held.delete(id);
};

const downloadAndOpen = (sealed) =>
  fetch(sealed.url)
    .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error("File not found"))))
    .then((data) => openFile(data, sealed));

// a view-once photo is never kept, so it is downloaded and decrypted only for the moment it is shown
export const openViewOnceFile = async (sealed) => new Blob([await downloadAndOpen(sealed)], { type: sealed.mimeType });

// a friend's file is downloaded and decrypted once, however many times it is shown
const opened = new Map();

export const openedFileUrl = (sealed) => {
  if (!opened.has(sealed.url)) {
    const opening = downloadAndOpen(sealed).then((bytes) => URL.createObjectURL(new Blob([bytes], { type: sealed.mimeType })));
    opening.catch(() => opened.delete(sealed.url));
    opened.set(sealed.url, opening);
  }
  return opened.get(sealed.url);
};

export const releaseAllAttachments = () => {
  [...held.keys()].forEach(releaseAttachment);
  opened.forEach((opening) => opening.then(URL.revokeObjectURL, () => {}));
  opened.clear();
};

export const pickFiles = (accept, { multiple = true } = {}) =>
  new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;
    input.accept = accept.join(",");
    input.addEventListener("change", () => resolve(Array.from(input.files)));
    input.click();
  });
