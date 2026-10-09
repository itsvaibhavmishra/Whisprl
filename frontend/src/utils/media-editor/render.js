import { LONG_EDGE, preparedFromCanvas } from "@/utils/attachments";
import { drawBase, drawLayers, drawStrokes } from "@/utils/media-editor/draw";
import { loadEditorFonts } from "@/utils/media-editor/fonts";
import { layerBoxOf } from "@/utils/media-editor/layout";

const STORY_SIZE = { width: 900, height: 1600 };

export const NO_EDITS = { filter: null, background: 0, strokes: [], layers: [] };

export const hasEdits = (edits) => Boolean(edits && (edits.filter || edits.strokes.length || edits.layers.length));

// a GIF redrawn would keep only its first frame
export const isGif = (media) => media?.file?.type === "image/gif";

const canvasOf = ({ width, height }) => Object.assign(document.createElement("canvas"), { width, height });

// strokes get their own canvas, so the eraser takes out drawing and never the photo beneath
const drawOverlay = (context, edits) => {
  const strokes = canvasOf(context.canvas);
  drawStrokes(strokes.getContext("2d"), edits.strokes);
  context.drawImage(strokes, 0, 0);
  drawLayers(context, edits.layers);
};

const overlayOf = async (edits, width, height) => {
  await loadEditorFonts();
  const canvas = canvasOf({ width, height });
  drawOverlay(canvas.getContext("2d"), edits);
  return canvas;
};

export const videoOverlayOf = (edits) => (hasEdits(edits) ? (width, height) => overlayOf(edits, width, height) : undefined);

const frameOf = (image, isStory) => {
  if (isStory || !image) return STORY_SIZE;
  const scale = Math.min(1, LONG_EDGE / Math.max(image.width, image.height));
  return { width: Math.round(image.width * scale), height: Math.round(image.height * scale) };
};

export const renderPhoto = async ({ file, edits, isStory = false }) => {
  await loadEditorFonts();
  const image = file && (await createImageBitmap(file));
  const canvas = canvasOf(frameOf(image, isStory));
  const context = canvas.getContext("2d");
  drawBase(context, { image, edits, isStory });
  drawOverlay(context, edits);
  image?.close();
  return preparedFromCanvas(canvas, `${(file?.name ?? "story").replace(/\.[^.]+$/, "")}.jpg`);
};

export const altOf = (edits) =>
  edits.layers
    .filter((layer) => layer.kind === "text")
    .map((layer) => layer.text.trim())
    .join("\n")
    .trim() || undefined;

export const mentionsOf = (edits, { width, height }) => {
  const mentions = edits.layers
    .filter((layer) => layer.kind === "mention")
    .map((layer) => {
      const box = layerBoxOf(layer);
      const [cos, sin] = [Math.abs(Math.cos(layer.rotation)), Math.abs(Math.sin(layer.rotation))];
      const across = (box.width * cos + box.height * sin) * layer.scale;
      const down = ((box.width * sin + box.height * cos) * layer.scale * width) / height;
      return { userId: layer.userId, username: layer.username, box: { x: layer.x - across / 2, y: layer.y - down / 2, width: across, height: down } };
    });
  return mentions.length ? mentions : undefined;
};
