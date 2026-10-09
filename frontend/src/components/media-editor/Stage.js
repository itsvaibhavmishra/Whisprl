import { useCallback, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { Trash } from "phosphor-react";

import LayerView from "@/components/media-editor/LayerView";
import useStageGestures, { BIN_LIFT, binOf } from "@/components/media-editor/useStageGestures";
import useObjectUrl from "@/hooks/useObjectUrl";
import { drawBase, drawStrokes, pixelRatio } from "@/utils/media-editor/draw";
import { isGif } from "@/utils/media-editor/render";

const FILL = { position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" };
const CANVAS = { ...FILL, pointerEvents: "none" };
const GUIDE = { position: "absolute", bgcolor: "rgba(255, 255, 255, 0.8)", pointerEvents: "none" };

const Stage = ({ media, image, edits, isStory, size, brush, hiddenLayerId, isMuted = true, isReadOnly = false, onStroke, onLayerChange, onLayerRemove, onLayerTap, onSwipe, onPhotoChange }) => {
  const base = useRef(null);
  const strokes = useRef(null);
  const frame = useRef(0);
  const playsFile = media?.kind === "video" || isGif(media);
  const url = useObjectUrl(playsFile ? media.file : null);
  const ratio = pixelRatio();
  const pixels = { width: Math.round(size.width * ratio), height: Math.round(size.height * ratio) };
  const { filter, background, photo } = edits;
  const bin = binOf(size);

  useEffect(() => {
    if (!playsFile && (image || !media)) drawBase(base.current.getContext("2d"), { image, edits: { filter, background, photo }, isStory });
  }, [playsFile, image, media, filter, background, photo, isStory, pixels.width, pixels.height]);

  const redrawStrokes = useCallback((live) => drawStrokes(strokes.current.getContext("2d"), live ? [...edits.strokes, live] : edits.strokes), [edits.strokes]);

  useEffect(() => {
    redrawStrokes(null);
  }, [redrawStrokes, pixels.width, pixels.height]);

  const { drag, onWheel, handlers } = useStageGestures({
    size,
    layers: edits.layers,
    photo,
    brush,
    onLiveStroke: (stroke) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => redrawStrokes(stroke));
    },
    onStrokeEnd: (stroke) => {
      cancelAnimationFrame(frame.current);
      if (stroke) onStroke(stroke);
      else redrawStrokes(null);
    },
    onLayerChange,
    onLayerRemove,
    onLayerTap,
    onSwipe,
    onPhotoChange,
  });
  const dragged = drag && edits.layers.find((layer) => layer.id === drag.id);

  const root = useRef(null);
  const latestWheel = useRef(onWheel);
  latestWheel.current = onWheel;
  const canZoom = Boolean(onWheel);

  // attached by hand, since React's wheel listener is passive and cannot stop a trackpad pinch from zooming the page
  useEffect(() => {
    if (!canZoom) return undefined;
    const node = root.current;
    const zoom = (event) => {
      event.preventDefault();
      latestWheel.current(event);
    };
    node.addEventListener("wheel", zoom, { passive: false });
    return () => node.removeEventListener("wheel", zoom);
  }, [canZoom]);

  return (
    <Box
      ref={root}
      role="group"
      aria-label="Canvas"
      {...(!isReadOnly && handlers)}
      sx={{ position: "relative", width: size.width, height: size.height, flexShrink: 0, overflow: "hidden", borderRadius: 2, bgcolor: "#000", touchAction: "none", userSelect: "none", cursor: brush ? "crosshair" : "default" }}
    >
      {playsFile && media.kind === "video" && <Box component="video" src={url ?? undefined} autoPlay loop muted={isMuted} playsInline controls={isReadOnly} sx={{ ...FILL, objectFit: "fill" }} />}
      {playsFile && media.kind === "image" && <Box component="img" src={url ?? undefined} alt="" sx={{ ...FILL, objectFit: "fill" }} />}
      {!playsFile && <canvas ref={base} width={pixels.width} height={pixels.height} style={CANVAS} />}
      <canvas ref={strokes} width={pixels.width} height={pixels.height} style={CANVAS} />

      {/* beneath the layers, so whatever is dropped in stays visible above it */}
      {drag?.canBin && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: "50%",
            bottom: BIN_LIFT - 24,
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            color: "#fff",
            border: "2px solid #fff",
            bgcolor: drag.isOverBin ? "error.main" : "rgba(0, 0, 0, 0.35)",
            transform: `translateX(-50%) scale(${drag.isOverBin ? 1.25 : 1})`,
            transition: "transform 120ms, background-color 120ms",
            pointerEvents: "none",
          }}
        >
          <Trash size={22} />
        </Box>
      )}

      {edits.layers.map((layer) => (
        <LayerView
          key={layer.id}
          layer={layer}
          stage={size}
          isHidden={layer.id === hiddenLayerId}
          binOffset={drag?.isOverBin && drag.id === layer.id ? { x: bin.x - layer.x * size.width, y: bin.y - layer.y * size.height } : null}
          isInteractive={!isReadOnly && !brush}
          onChange={(patch) => onLayerChange(layer.id, patch)}
          onRemove={() => onLayerRemove(layer.id)}
          onTap={() => onLayerTap(layer.id)}
        />
      ))}

      {drag?.guides.x && !drag.isOverBin && <Box sx={{ ...GUIDE, top: 0, bottom: 0, left: "50%", width: "1px" }} />}
      {drag?.guides.y && !drag.isOverBin && <Box sx={{ ...GUIDE, left: 0, right: 0, top: "50%", height: "1px" }} />}
      {drag?.guides.turn && dragged && (
        <Box
          sx={{
            ...GUIDE,
            left: dragged.x * size.width - size.width - size.height,
            top: dragged.y * size.height,
            width: (size.width + size.height) * 2,
            height: "1px",
            transform: `rotate(${dragged.rotation}rad)`,
          }}
        />
      )}
    </Box>
  );
};

export default Stage;
