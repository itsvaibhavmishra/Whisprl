import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

import { drawLayer, pixelRatio } from "@/utils/media-editor/draw";
import { layerBoxOf } from "@/utils/media-editor/layout";

const NUDGE = 0.01;
const BINNED_SCALE = 0.3;
const NUDGES = { ArrowLeft: [-NUDGE, 0], ArrowRight: [NUDGE, 0], ArrowUp: [0, -NUDGE], ArrowDown: [0, NUDGE] };

const labelOf = (layer) => {
  if (layer.kind === "text") return `Text: ${layer.text}`;
  return layer.kind === "mention" ? `Mention @${layer.username}` : `Sticker ${layer.emoji}`;
};

// the bin's offset runs along the stage, so it is turned back through the layer's own rotation
const binnedOf = (offset, rotation) => {
  if (!offset) return { transform: "none", opacity: 1 };
  const [cos, sin] = [Math.cos(rotation), Math.sin(rotation)];
  const across = offset.x * cos + offset.y * sin;
  const down = offset.y * cos - offset.x * sin;
  return { transform: `translate(${across}px, ${down}px) scale(${BINNED_SCALE})`, opacity: 0.7 };
};

// each layer is drawn by the same code that draws the shared file, so what is placed here is what friends see
const LayerView = ({ layer, stage, isHidden, binOffset, isInteractive, onChange, onRemove, onTap }) => {
  const canvas = useRef(null);
  const box = layerBoxOf(layer);
  const stagePixels = stage.width * layer.scale;
  const reach = box.glowReach * stagePixels;
  const outer = { width: box.width * stagePixels + reach * 2, height: box.height * stagePixels + reach * 2 };
  const ratio = pixelRatio();

  useEffect(() => {
    const node = canvas.current;
    node.width = Math.ceil(outer.width * ratio);
    node.height = Math.ceil(outer.height * ratio);
    const context = node.getContext("2d");
    context.translate(node.width / 2, node.height / 2);
    drawLayer(context, layer, stagePixels * ratio);
  }, [layer, stagePixels, ratio, outer.width, outer.height]);

  const onKeyDown = (event) => {
    const nudge = NUDGES[event.key];
    if (nudge) {
      event.preventDefault();
      onChange({ x: layer.x + nudge[0], y: layer.y + nudge[1] });
    }
    if (event.key === "Delete" || event.key === "Backspace") onRemove();
    if (event.key === "Enter") onTap();
  };

  return (
    <Box
      data-layer-id={layer.id}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? labelOf(layer) : undefined}
      aria-hidden={isInteractive ? undefined : true}
      onKeyDown={isInteractive ? onKeyDown : undefined}
      sx={{
        position: "absolute",
        left: layer.x * stage.width,
        top: layer.y * stage.height,
        width: box.width * stagePixels,
        height: box.height * stagePixels,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}rad)`,
        visibility: isHidden ? "hidden" : "visible",
        pointerEvents: isInteractive ? "auto" : "none",
        cursor: "grab",
        outline: "none",
        "&:focus-visible": { outline: "2px dashed #fff", outlineOffset: 6 },
        "&:hover [data-handle], &:focus-visible [data-handle]": { opacity: 1 },
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "transform 160ms ease-out, opacity 160ms ease-out", ...binnedOf(binOffset, layer.rotation) }}>
        <canvas ref={canvas} style={{ position: "absolute", left: -reach, top: -reach, width: outer.width, height: outer.height }} />
      </Box>
      {isInteractive && (
        <Box
          data-handle
          aria-hidden
          sx={{
            position: "absolute",
            right: -12,
            bottom: -12,
            width: 22,
            height: 22,
            borderRadius: "50%",
            bgcolor: "#fff",
            border: "2px solid rgba(0, 0, 0, 0.35)",
            cursor: "nwse-resize",
            opacity: 0,
            transition: "opacity 150ms",
            "@media (pointer: coarse)": { display: "none" },
          }}
        />
      )}
    </Box>
  );
};

export default LayerView;
