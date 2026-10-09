import { useRef, useState } from "react";
import { Box, Button, ButtonBase, InputBase, Stack } from "@mui/material";
import { TextAlignCenter, TextAlignLeft, TextAlignRight, TextT } from "phosphor-react";

import { ColorRow, SizeSlider, ToolButton } from "@/components/media-editor/ToolControls";
import { TEXT_FONTS, fontNamed } from "@/utils/media-editor/fonts";
import { LINE_HEIGHT, WRAP_WIDTH } from "@/utils/media-editor/layout";
import { inkOn } from "@/utils/media-editor/palette";

const MAX_TEXT = 300;
const TEXT_SIZES = { min: 0.04, max: 0.16 };
const ALIGNMENTS = { center: TextAlignCenter, left: TextAlignLeft, right: TextAlignRight };
const BACKGROUNDS = { none: "regular", solid: "fill", soft: "duotone" };

const following = (options, current) => {
  const names = Object.keys(options);
  return names[(names.indexOf(current) + 1) % names.length];
};

const cssOf = (font) => ({ fontFamily: `"${font.family}"`, fontWeight: font.weight, fontStyle: font.isItalic ? "italic" : "normal", textTransform: font.isCapitals ? "uppercase" : "none" });

const FontRow = ({ value, onChange }) => (
  <Stack direction="row" spacing={1} sx={{ px: 2, pt: 0.5, pb: 2, overflowX: "auto" }}>
    {TEXT_FONTS.map((font) => (
      <ButtonBase
        key={font.name}
        aria-label={`${font.name} font`}
        aria-pressed={value === font.name}
        onClick={() => onChange(font.name)}
        sx={{
          ...cssOf(font),
          flexShrink: 0,
          px: 1.75,
          py: 0.75,
          fontSize: 14,
          borderRadius: 99,
          border: "1px solid rgba(255, 255, 255, 0.6)",
          ...(value === font.name && { bgcolor: "#fff", color: "#000" }),
        }}
      >
        {font.name}
      </ButtonBase>
    ))}
  </Stack>
);

// typing happens in a plain field styled like the result at its unpinched size, so its lines break where the layer's do
const TextEditor = ({ layer, stageWidth, onDone }) => {
  const [draft, setDraft] = useState(layer);
  const change = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const font = fontNamed(draft.font);
  const fontSize = draft.size * stageWidth;
  const AlignIcon = ALIGNMENTS[draft.align];
  const pressedBeside = useRef(false);
  const finish = () => onDone(draft);

  const onKeyDown = (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    finish();
  };

  return (
    <Stack onKeyDown={onKeyDown} sx={{ position: "absolute", inset: 0, zIndex: 2, bgcolor: "rgba(0, 0, 0, 0.6)", color: "#fff" }}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1, height: 56, flexShrink: 0 }}>
        <ToolButton label="Align text" onClick={() => change({ align: following(ALIGNMENTS, draft.align) })}>
          <AlignIcon size={24} />
        </ToolButton>
        <ToolButton label="Text background" isPressed={draft.style !== "none"} onClick={() => change({ style: following(BACKGROUNDS, draft.style) })}>
          <TextT size={24} weight={BACKGROUNDS[draft.style]} />
        </ToolButton>
        <Box sx={{ flex: 1 }} />
        <Button onClick={finish} sx={{ color: "#fff", fontWeight: 800 }}>
          Done
        </Button>
      </Stack>

      {/* only a press that starts beside the text closes it, so the tap that opened the editor cannot also close it */}
      <Box
        onPointerDown={(event) => (pressedBeside.current = event.target === event.currentTarget)}
        onClick={(event) => event.target === event.currentTarget && pressedBeside.current && finish()}
        sx={{ position: "relative", flex: 1, minHeight: 0, display: "grid", placeItems: "center" }}
      >
        <SizeSlider label="Text size" value={draft.size} min={TEXT_SIZES.min} max={TEXT_SIZES.max} onChange={(size) => change({ size })} />
        <InputBase
          autoFocus
          multiline
          value={draft.text}
          onChange={(event) => change({ text: event.target.value })}
          placeholder="Type something"
          inputProps={{ maxLength: MAX_TEXT, "aria-label": "Text" }}
          sx={{
            width: WRAP_WIDTH * stageWidth + fontSize * 0.6,
            maxWidth: "calc(100% - 64px)",
            p: 0,
            "& textarea": {
              ...cssOf(font),
              fontSize,
              lineHeight: LINE_HEIGHT,
              textAlign: draft.align,
              color: draft.style === "solid" ? inkOn(draft.color) : draft.color,
              bgcolor: { solid: draft.color, soft: "rgba(0, 0, 0, 0.5)" }[draft.style] ?? "transparent",
              borderRadius: `${fontSize * 0.25}px`,
              px: `${fontSize * 0.3}px`,
              textShadow: font.glows ? `0 0 ${fontSize * 0.25}px ${draft.color}` : "none",
            },
            "& textarea::placeholder": { color: "rgba(255, 255, 255, 0.7)", textTransform: "none" },
          }}
        />
      </Box>

      <ColorRow value={draft.color} onChange={(color) => change({ color })} />
      <FontRow value={draft.font} onChange={(name) => change({ font: name })} />
    </Stack>
  );
};

export default TextEditor;
