import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogTitle, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import {
  ArrowCounterClockwise,
  At,
  Eraser,
  HighlighterCircle,
  Lightning,
  MagicWand,
  Palette,
  PencilSimple,
  ScribbleLoop,
  SpeakerHigh,
  SpeakerSlash,
  Sticker,
  TextAa,
  X,
} from "phosphor-react";

import EmojiPicker from "@/components/EmojiPicker";
import FilterStrip from "@/components/media-editor/FilterStrip";
import MentionPicker from "@/components/media-editor/MentionPicker";
import Stage from "@/components/media-editor/Stage";
import TextEditor from "@/components/media-editor/TextEditor";
import { ColorRow, SizeSlider, ToolButton } from "@/components/media-editor/ToolControls";
import ToolSheet from "@/components/media-editor/ToolSheet";
import useFittedSize from "@/hooks/useFittedSize";
import useImageBitmap from "@/hooks/useImageBitmap";
import { BRUSHES, lineWidthOf } from "@/utils/media-editor/draw";
import { PHOTO_FILTERS, filterNamed } from "@/utils/media-editor/filters";
import { loadEditorFonts } from "@/utils/media-editor/fonts";
import { COLORS, GRADIENTS } from "@/utils/media-editor/palette";
import { NO_EDITS, isGif } from "@/utils/media-editor/render";
import uuidv4 from "@/utils/uuidv4";
import { canDrawOnVideos } from "@/utils/video";

const STORY_ASPECT = 9 / 16;
const BRUSH_ICONS = { Pen: PencilSimple, Marker: HighlighterCircle, Neon: Lightning, Eraser };
const BRUSH_SIZES = { min: 0.004, max: 0.04 };
const STICKER_SIZES = { emoji: 0.22, mention: 0.055 };
const PLACED = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
const NEW_TEXT = { ...PLACED, y: 0.42, kind: "text", text: "", font: "Classic", color: COLORS[0].value, align: "center", style: "none", size: 0.08 };

const fadeAway = keyframes`
  0% { opacity: 0; transform: scale(0.92); }
  15%, 70% { opacity: 1; transform: none; }
  100% { opacity: 0; }
`;

const lingerThenFade = keyframes`
  0%, 60% { opacity: 1; }
  100% { opacity: 0; }
`;

// a picked filter's name shows briefly, as a swipe gives no other sign of which one is on
const FilterName = ({ name }) => (
  <Typography aria-hidden sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", fontSize: 32, fontWeight: 800, textShadow: "0 2px 12px rgba(0, 0, 0, 0.5)", animation: `${fadeAway} 1100ms forwards` }}>
    {name}
  </Typography>
);

const BrushPreview = ({ brush, stageWidth }) => {
  const diameter = lineWidthOf(brush.name, brush.size, stageWidth);
  const isEraser = brush.name === "Eraser";
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: diameter,
        height: diameter,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        bgcolor: isEraser ? "transparent" : brush.color,
        border: "2px solid #fff",
        boxShadow: brush.name === "Neon" ? `0 0 ${diameter}px ${brush.color}` : "0 0 0 1px rgba(0, 0, 0, 0.35)",
        pointerEvents: "none",
        animation: `${lingerThenFade} 1000ms forwards`,
      }}
    />
  );
};

// edits stay as data until the caller draws them, so a photo, a video and a story without either all share one editor
const MediaEditor = ({ media, initialEdits = NO_EDITS, isStory = false, people = [], label, doneLabel, footer, onDone, onClose }) => {
  const [edits, setEdits] = useState(initialEdits);
  const [tool, setTool] = useState(null);
  const [editing, setEditing] = useState(() => (media ? null : { ...NEW_TEXT, id: uuidv4() }));
  const [brush, setBrush] = useState({ name: "Pen", color: COLORS[0].value, size: 0.012 });
  const [isMuted, setIsMuted] = useState(true);
  const [sheetAnchor, setSheetAnchor] = useState(null);
  const [flash, setFlash] = useState(null);
  const [brushShown, setBrushShown] = useState(null);
  const [areFontsReady, setAreFontsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [canDrawOnVideo, setCanDrawOnVideo] = useState(false);
  const isPhoto = media?.kind === "image" && !isGif(media);
  const isVideo = media?.kind === "video";
  const image = useImageBitmap(isPhoto ? media.file : null);
  const canEdit = !media || isPhoto || (isVideo && canDrawOnVideo);
  const [areaRef, size] = useFittedSize(!media || (isStory && isPhoto) ? STORY_ASPECT : media.width / media.height);

  useEffect(() => {
    loadEditorFonts().then(() => setAreFontsReady(true));
  }, []);

  useEffect(() => {
    if (isVideo) canDrawOnVideos().then(setCanDrawOnVideo, () => {});
  }, [isVideo]);

  const changeLayers = (change) => setEdits((current) => ({ ...current, layers: change(current.layers) }));
  const updateLayer = (id, patch) => changeLayers((layers) => layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)));
  const removeLayer = (id) => changeLayers((layers) => layers.filter((layer) => layer.id !== id));
  const addLayer = (layer) => changeLayers((layers) => [...layers, layer]);

  const editText = (id) => {
    const layer = edits.layers.find((one) => one.id === id);
    if (layer?.kind === "text") setEditing(layer);
  };

  const finishText = (layer) => {
    setEditing(null);
    const exists = edits.layers.some((one) => one.id === layer.id);
    if (!layer.text.trim()) {
      if (exists) removeLayer(layer.id);
    } else if (exists) updateLayer(layer.id, layer);
    else addLayer(layer);
  };

  const openSheet = (name) => (event) => {
    setSheetAnchor(event.currentTarget);
    setTool(name);
  };

  const resizeBrush = (next) => {
    setBrush((current) => ({ ...current, size: next }));
    setBrushShown(uuidv4());
  };

  const addSticker = (sticker) => {
    setTool(null);
    addLayer({ ...PLACED, id: uuidv4(), size: STICKER_SIZES[sticker.kind], ...sticker });
  };

  const chooseFilter = (filter) => {
    setEdits((current) => ({ ...current, filter: filter.matrix ? filter.name : null }));
    setFlash({ name: filter.name, key: uuidv4() });
  };

  const swipeFilter = (step) => {
    const index = PHOTO_FILTERS.indexOf(filterNamed(edits.filter));
    chooseFilter(PHOTO_FILTERS[(index + step + PHOTO_FILTERS.length) % PHOTO_FILTERS.length]);
  };

  // the caller may still be drawing the edits in, so nothing can close the editor until it is done
  const finish = async () => {
    setIsSaving(true);
    try {
      await onDone(edits);
    } finally {
      setIsSaving(false);
    }
  };

  const askToClose = () => (edits === initialEdits ? onClose() : setIsDiscarding(true));
  // Escape first steps out of drawing or filters, as their own Done would
  const onEscape = () => (tool ? setTool(null) : askToClose());

  const isEmpty = !media && !edits.layers.length && !edits.strokes.length;
  const isDrawing = tool === "draw";
  // hidden rather than removed while text is typed, so the stage keeps its size and only one Done can be reached
  const behindText = { visibility: editing ? "hidden" : "visible", flexShrink: 0 };

  const toolbar = isDrawing ? (
    <>
      {BRUSHES.map((name) => {
        const Icon = BRUSH_ICONS[name];
        return (
          <ToolButton key={name} label={name} isPressed={brush.name === name} onClick={() => setBrush((current) => ({ ...current, name }))}>
            <Icon size={22} />
          </ToolButton>
        );
      })}
      <Box sx={{ flex: 1 }} />
      <ToolButton label="Undo" onClick={() => setEdits((current) => ({ ...current, strokes: current.strokes.slice(0, -1) }))} disabled={!edits.strokes.length}>
        <ArrowCounterClockwise size={22} />
      </ToolButton>
      <Button onClick={() => setTool(null)} sx={{ color: "#fff", fontWeight: 800 }}>
        Done
      </Button>
    </>
  ) : (
    <>
      {!media && (
        <ToolButton label="Change background" onClick={() => setEdits((current) => ({ ...current, background: (current.background + 1) % GRADIENTS.length }))}>
          <Palette size={22} />
        </ToolButton>
      )}
      {canEdit && (
        <>
          <ToolButton label="Add text" onClick={() => setEditing({ ...NEW_TEXT, id: uuidv4() })}>
            <TextAa size={22} />
          </ToolButton>
          {people.length > 0 && (
            <ToolButton label="Mention a friend" onClick={openSheet("mention")}>
              <At size={22} />
            </ToolButton>
          )}
          <ToolButton label="Add a sticker" onClick={openSheet("stickers")}>
            <Sticker size={22} />
          </ToolButton>
          <ToolButton label="Draw" onClick={() => setTool("draw")}>
            <ScribbleLoop size={22} />
          </ToolButton>
        </>
      )}
      {isPhoto && (
        <ToolButton label="Filters" isPressed={tool === "filters"} onClick={() => setTool((current) => (current === "filters" ? null : "filters"))}>
          <MagicWand size={22} />
        </ToolButton>
      )}
      {isVideo && (
        <ToolButton label={isMuted ? "Turn sound on" : "Turn sound off"} onClick={() => setIsMuted((current) => !current)}>
          {isMuted ? <SpeakerSlash size={22} /> : <SpeakerHigh size={22} />}
        </ToolButton>
      )}
      <Box sx={{ flex: 1 }} />
      <ToolButton label="Close" onClick={askToClose} disabled={isSaving}>
        <X size={22} />
      </ToolButton>
    </>
  );

  return (
    <Dialog open fullScreen onClose={isSaving ? undefined : onEscape} PaperProps={{ "aria-label": label, sx: { bgcolor: "#000", color: "#fff" } }}>
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ...behindText, px: 1, height: 56 }}>
          {toolbar}
        </Stack>

        <Box ref={areaRef} sx={{ position: "relative", flex: 1, minHeight: 0, mx: 1, display: "grid", placeItems: "center" }}>
          {size && areFontsReady ? (
            <Stage
              media={media}
              image={image}
              edits={edits}
              isStory={isStory}
              size={size}
              brush={isDrawing ? brush : null}
              hiddenLayerId={editing?.id}
              isMuted={isMuted}
              onStroke={(stroke) => setEdits((current) => ({ ...current, strokes: [...current.strokes, stroke] }))}
              onLayerChange={updateLayer}
              onLayerRemove={removeLayer}
              onLayerTap={editText}
              onSwipe={isPhoto && !tool ? swipeFilter : undefined}
              onPhotoChange={isStory && isPhoto ? (photo) => setEdits((current) => ({ ...current, photo })) : undefined}
            />
          ) : (
            <CircularProgress aria-label="Opening the editor" sx={{ color: "#fff" }} />
          )}
          {isDrawing && <SizeSlider label="Brush size" value={brush.size} min={BRUSH_SIZES.min} max={BRUSH_SIZES.max} onChange={resizeBrush} />}
          {isDrawing && brushShown && size && <BrushPreview key={brushShown} brush={brush} stageWidth={size.width} />}
          {flash && <FilterName key={flash.key} name={flash.name} />}
          {isEmpty && !editing && (
            <Button onClick={() => setEditing({ ...NEW_TEXT, id: uuidv4() })} sx={{ position: "absolute", color: "#fff", fontSize: 22, fontWeight: 800 }}>
              Tap to type
            </Button>
          )}
        </Box>

        {isDrawing && brush.name !== "Eraser" && <ColorRow value={brush.color} onChange={(color) => setBrush((current) => ({ ...current, color }))} />}
        {tool === "filters" && <FilterStrip image={image} chosen={edits.filter} onChoose={chooseFilter} />}
        {!isDrawing && (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ...behindText, px: 2, py: 1.5 }}>
            {footer}
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={finish} disabled={isEmpty || isSaving}>
              {doneLabel}
            </Button>
          </Stack>
        )}
      </Stack>

      {editing && size && areFontsReady && <TextEditor layer={editing} stageWidth={size.width} onDone={finishText} />}
      {isDiscarding && (
        <Dialog open onClose={() => setIsDiscarding(false)} aria-labelledby="discard-title">
          <DialogTitle id="discard-title">Discard your edits?</DialogTitle>
          <DialogActions>
            <Button color="inherit" onClick={() => setIsDiscarding(false)}>
              Keep editing
            </Button>
            <Button color="error" variant="contained" onClick={onClose}>
              Discard
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {tool === "stickers" && (
        <ToolSheet anchor={sheetAnchor} label="Add a sticker" onClose={() => setTool(null)}>
          <EmojiPicker onSelect={(emoji) => addSticker({ kind: "emoji", emoji })} autoFocus={false} />
        </ToolSheet>
      )}
      {tool === "mention" && (
        <ToolSheet anchor={sheetAnchor} label="Mention a friend" onClose={() => setTool(null)}>
          <MentionPicker people={people} onPick={addSticker} />
        </ToolSheet>
      )}
    </Dialog>
  );
};

export default MediaEditor;
