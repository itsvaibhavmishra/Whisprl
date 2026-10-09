import { cssFontOf, fontNamed } from "@/utils/media-editor/fonts";

// sizes are fractions of the stage's width, so a layer looks the same on any screen and in the shared file
const REFERENCE_WIDTH = 1000;
export const WRAP_WIDTH = 0.84;
export const LINE_HEIGHT = 1.35;
const PADDING = 0.3;
const MENTION_FONT = { family: "Manrope", weight: 800 };

let measuring = null;
const measurer = () => (measuring ??= document.createElement("canvas").getContext("2d"));

const widthsIn = (font, size) => {
  const context = measurer();
  context.font = cssFontOf(font, size * REFERENCE_WIDTH);
  return (text) => context.measureText(text).width / REFERENCE_WIDTH;
};

const piecesOf = (word, widthOf, maxWidth) => {
  const pieces = [""];
  [...word].forEach((letter) => {
    if (pieces.at(-1) && widthOf(pieces.at(-1) + letter) > maxWidth) pieces.push(letter);
    else pieces[pieces.length - 1] += letter;
  });
  return pieces;
};

const wrap = (paragraph, widthOf, maxWidth) => {
  const lines = [];
  let line = "";
  paragraph.split(" ").forEach((word) => {
    const joined = line ? `${line} ${word}` : word;
    if (widthOf(joined) <= maxWidth) {
      line = joined;
      return;
    }
    if (line) lines.push(line);
    const pieces = piecesOf(word, widthOf, maxWidth);
    lines.push(...pieces.slice(0, -1));
    line = pieces.at(-1);
  });
  return [...lines, line];
};

const shownTextOf = (layer) => (fontNamed(layer.font).isCapitals ? layer.text.toUpperCase() : layer.text);

// lines are broken here once, so the editor and the shared file break them in the same places
export const textLayoutOf = (layer) => {
  const font = fontNamed(layer.font);
  const widthOf = widthsIn(font, layer.size);
  const padding = layer.size * PADDING;
  const lines = shownTextOf(layer)
    .split("\n")
    .flatMap((paragraph) => wrap(paragraph, widthOf, WRAP_WIDTH))
    .map((text) => ({ text, width: widthOf(text) + padding * 2 }));
  const lineHeight = layer.size * LINE_HEIGHT;
  return { font, lines, padding, lineHeight, width: Math.max(...lines.map((line) => line.width)), height: lines.length * lineHeight };
};

export const mentionLayoutOf = (layer) => {
  const text = `@${layer.username}`.toUpperCase();
  const padding = layer.size * 0.55;
  return { font: MENTION_FONT, text, padding, width: widthsIn(MENTION_FONT, layer.size)(text) + padding * 2, height: layer.size * 1.9 };
};

export const layerBoxOf = (layer) => {
  if (layer.kind === "text") {
    const { width, height } = textLayoutOf(layer);
    return { width, height, glowReach: layer.size * (fontNamed(layer.font).glows ? 0.8 : 0.1) };
  }
  if (layer.kind === "mention") {
    const { width, height } = mentionLayoutOf(layer);
    return { width, height, glowReach: layer.size * 0.1 };
  }
  return { width: layer.size * 1.25, height: layer.size * 1.25, glowReach: layer.size * 0.1 };
};
