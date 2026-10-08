import { applyMatrix, filterNamed } from "@/utils/media-editor/filters";
import { cssFontOf } from "@/utils/media-editor/fonts";
import { mentionLayoutOf, textLayoutOf } from "@/utils/media-editor/layout";
import { GRADIENTS, inkOn } from "@/utils/media-editor/palette";

export const BRUSHES = ["Pen", "Marker", "Neon", "Eraser"];

const EMOJI_FONTS = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const MENTION_INK = ["#f58529", "#dd2a7b", "#8134af"];
const BACKDROP_SHRINK = 32;
const BACKDROP_STEPS = [12, 4, 2];

const WIDTH_FACTORS = { Marker: 2.4, Eraser: 2.4 };

// past twice the screen's density a canvas costs memory without looking any sharper
export const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

export const lineWidthOf = (brush, size, width) => size * width * (WIDTH_FACTORS[brush] ?? 1);

const traceStroke = (context, points, width, height) => {
  context.beginPath();
  points.forEach(([across, down], index) => {
    if (index) context.lineTo(across * width, down * height);
    else context.moveTo(across * width, down * height);
  });
  // a tap leaves a single point, which only draws once the line has some length
  if (points.length === 1) context.lineTo(points[0][0] * width + 0.01, points[0][1] * height);
};

const drawStroke = (context, { brush, color, size, points }, width, height) => {
  const lineWidth = lineWidthOf(brush, size, width);
  context.save();
  Object.assign(context, { lineCap: "round", lineJoin: "round", strokeStyle: color, lineWidth });
  traceStroke(context, points, width, height);
  if (brush === "Marker") Object.assign(context, { globalAlpha: 0.5, lineCap: "square" });
  if (brush === "Eraser") context.globalCompositeOperation = "destination-out";
  if (brush === "Neon") Object.assign(context, { shadowColor: color, shadowBlur: lineWidth * 2 });
  context.stroke();
  if (brush === "Neon") {
    Object.assign(context, { shadowBlur: 0, strokeStyle: "rgba(255, 255, 255, 0.85)", lineWidth: lineWidth * 0.4 });
    context.stroke();
  }
  context.restore();
};

export const drawStrokes = (context, strokes) => {
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  strokes.forEach((stroke) => drawStroke(context, stroke, width, height));
};

const drawText = (context, layer, stagePixels) => {
  const { font, lines, padding, lineHeight, width, height } = textLayoutOf(layer);
  const box = { solid: layer.color, soft: "rgba(0, 0, 0, 0.5)" }[layer.style];
  const ink = layer.style === "solid" ? inkOn(layer.color) : layer.color;
  Object.assign(context, { font: cssFontOf(font, layer.size * stagePixels), textAlign: "left", textBaseline: "middle" });
  lines.forEach((line, index) => {
    if (!line.text.trim()) return;
    const offset = { left: 0, center: (width - line.width) / 2, right: width - line.width }[layer.align];
    const left = (offset - width / 2) * stagePixels;
    const top = (index * lineHeight - height / 2) * stagePixels;
    if (box) {
      context.fillStyle = box;
      context.beginPath();
      context.roundRect(left, top, line.width * stagePixels, lineHeight * stagePixels, layer.size * stagePixels * 0.25);
      context.fill();
    }
    context.fillStyle = ink;
    if (font.glows) Object.assign(context, { shadowColor: layer.color, shadowBlur: layer.size * stagePixels * 0.5 });
    context.fillText(line.text, left + padding * stagePixels, top + (lineHeight * stagePixels) / 2);
    context.shadowBlur = 0;
  });
};

const drawMention = (context, layer, stagePixels) => {
  const { font, text, padding, width, height } = mentionLayoutOf(layer);
  const [left, top] = [(-width / 2) * stagePixels, (-height / 2) * stagePixels];
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(left, top, width * stagePixels, height * stagePixels, (height * stagePixels) / 2);
  context.fill();
  const ink = context.createLinearGradient(left, 0, -left, 0);
  MENTION_INK.forEach((color, index) => ink.addColorStop(index / (MENTION_INK.length - 1), color));
  Object.assign(context, { fillStyle: ink, font: cssFontOf(font, layer.size * stagePixels), textAlign: "left", textBaseline: "middle" });
  context.fillText(text, left + padding * stagePixels, 0);
};

const drawEmoji = (context, layer, stagePixels) => {
  Object.assign(context, { font: `${layer.size * stagePixels}px ${EMOJI_FONTS}`, textAlign: "center", textBaseline: "middle" });
  context.fillText(layer.emoji, 0, 0);
};

const DRAWERS = { text: drawText, mention: drawMention, emoji: drawEmoji };

// drawn around the context's origin, where the layer's centre sits
export const drawLayer = (context, layer, stagePixels) => {
  context.save();
  // a canvas on the page follows the app's right-to-left setting and one off the page does not, so both are pinned
  context.direction = "ltr";
  DRAWERS[layer.kind](context, layer, stagePixels);
  context.restore();
};

export const drawLayers = (context, layers) => {
  const { width, height } = context.canvas;
  layers.forEach((layer) => {
    context.save();
    context.translate(layer.x * width, layer.y * height);
    context.rotate(layer.rotation);
    drawLayer(context, layer, width * layer.scale);
    context.restore();
  });
};

const drawScaled = (context, image, scale, width, height) =>
  context.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale);

export const drawCovering = (context, image, width, height) => drawScaled(context, image, Math.max(width / image.width, height / image.height), width, height);

const drawContained = (context, image, width, height) => drawScaled(context, image, Math.min(width / image.width, height / image.height), width, height);

const shrunkCanvas = (width, height, shrink) => {
  const canvas = Object.assign(document.createElement("canvas"), { width: Math.ceil(width / shrink), height: Math.ceil(height / shrink) });
  canvas.getContext("2d").imageSmoothingQuality = "high";
  return canvas;
};

// a tiny copy blurs the same in every browser, which a canvas blur filter does not, and growing it back in steps keeps it free of blocks
const drawBackdrop = (context, image, width, height) => {
  let blurred = shrunkCanvas(width, height, BACKDROP_SHRINK);
  drawCovering(blurred.getContext("2d"), image, blurred.width, blurred.height);
  BACKDROP_STEPS.forEach((shrink) => {
    const larger = shrunkCanvas(width, height, shrink);
    larger.getContext("2d").drawImage(blurred, 0, 0, larger.width, larger.height);
    blurred = larger;
  });
  context.imageSmoothingQuality = "high";
  context.drawImage(blurred, 0, 0, width, height);
  context.fillStyle = "rgba(0, 0, 0, 0.3)";
  context.fillRect(0, 0, width, height);
};

const drawGradient = (context, index, width, height) => {
  const gradient = context.createLinearGradient(0, 0, width * 0.4, height);
  const { stops } = GRADIENTS[index];
  stops.forEach((color, step) => gradient.addColorStop(step / (stops.length - 1), color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
};

export const drawBase = (context, { image, edits, isStory }) => {
  const { width, height } = context.canvas;
  if (!image) return drawGradient(context, edits.background, width, height);
  if (isStory) drawBackdrop(context, image, width, height);
  else {
    // a JPEG has no transparency, so a PNG's clear parts turn white here as they do when it is sent unedited
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
  }
  drawContained(context, image, width, height);
  const { matrix } = filterNamed(edits.filter);
  if (matrix) applyMatrix(context, matrix);
};
