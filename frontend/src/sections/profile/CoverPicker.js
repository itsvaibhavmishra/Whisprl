import { useId, useState } from "react";
import { Box, Button, Drawer, IconButton, Popover, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Palette, Shuffle, Trash, UploadSimple } from "phosphor-react";

import { useCroppedImage } from "@/components/ImageMenu";
import { CoverArt, onCover } from "@/components/ProfileCover";
import { COVER_PALETTES, COVER_PATTERNS, GIVEN_PALETTES, GIVEN_PATTERNS, swatchOf } from "@/utils/covers";

const hiddenInput = { position: "absolute", opacity: 0, width: "1px", height: "1px", m: 0 };
const groupLabel = { fontSize: 12.5, fontWeight: 700, color: "text.secondary", mb: 1 };

const pickOther = (choices, current) => {
  const others = choices.filter((choice) => choice.id !== current);
  return others[Math.floor(Math.random() * others.length)].id;
};

const PatternChoice = ({ pattern, palette, isChosen, groupName, onChoose }) => (
  <Box component="label" sx={{ display: "grid", gap: 0.75, cursor: "pointer" }}>
    <Box component="input" type="radio" name={groupName} checked={isChosen} onChange={onChoose} aria-label={pattern.label} sx={hiddenInput} />
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: "3 / 1",
        borderRadius: 1.5,
        boxShadow: (theme) => (isChosen ? `0 0 0 2.5px ${theme.palette.primary.main}` : `0 0 0 1px ${theme.palette.divider}`),
        "input:focus-visible + &": { outline: 2, outlineColor: "primary.main", outlineOffset: 3 },
      }}
    >
      <CoverArt pattern={pattern.id} palette={palette} tileSize={420} isPreview />
    </Box>
    <Typography sx={{ fontSize: 12.5, fontWeight: isChosen ? 800 : 600, textAlign: "center" }}>{pattern.label}</Typography>
  </Box>
);

const SwatchChoice = ({ palette, isChosen, groupName, onChoose }) => (
  <Box component="label" title={palette.label} sx={{ p: "6px", display: "grid", cursor: "pointer" }}>
    <Box component="input" type="radio" name={groupName} checked={isChosen} onChange={onChoose} aria-label={palette.label} sx={hiddenInput} />
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: swatchOf(palette),
        boxShadow: (theme) =>
          isChosen ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4.5px ${theme.palette.primary.main}` : `inset 0 0 0 1px ${alpha(theme.palette.text.primary, 0.14)}`,
        "input:focus-visible + &": { outline: 2, outlineColor: "primary.main", outlineOffset: 4 },
      }}
    />
  </Box>
);

const CoverChoices = ({ coverStyle, photo, onStyleChange, onPick, onRemovePhoto }) => {
  const patternGroup = useId();
  const paletteGroup = useId();
  const choose = (change) => onStyleChange({ ...coverStyle, ...change });
  const surprise = () => onStyleChange({ pattern: pickOther(GIVEN_PATTERNS, coverStyle.pattern), palette: pickOther(GIVEN_PALETTES, coverStyle.palette) });

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" sx={{ m: 0, fontSize: 16, fontWeight: 800 }}>
          Cover
        </Typography>
        {!photo && (
          <Tooltip title="Surprise me">
            <IconButton aria-label="Surprise me" onClick={surprise} sx={{ width: 36, height: 36, bgcolor: "chat.field" }}>
              <Shuffle size={18} weight="bold" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {photo ? (
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Your photo covers the pattern. Remove it to see the pattern again.</Typography>
      ) : (
        <>
          <Box>
            <Typography sx={groupLabel}>Pattern</Typography>
            <Box role="radiogroup" aria-label="Cover pattern" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              {COVER_PATTERNS.map((pattern) => (
                <PatternChoice
                  key={pattern.id}
                  pattern={pattern}
                  palette={coverStyle.palette}
                  isChosen={coverStyle.pattern === pattern.id}
                  groupName={patternGroup}
                  onChoose={() => choose({ pattern: pattern.id })}
                />
              ))}
            </Box>
          </Box>
          <Box>
            <Typography sx={groupLabel}>Colour</Typography>
            <Box role="radiogroup" aria-label="Cover colour" sx={{ display: "flex", flexWrap: "wrap", mx: "-6px" }}>
              {COVER_PALETTES.map((palette) => (
                <SwatchChoice
                  key={palette.id}
                  palette={palette}
                  isChosen={coverStyle.palette === palette.id}
                  groupName={paletteGroup}
                  onChoose={() => choose({ palette: palette.id })}
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      <Stack direction="row" spacing={1}>
        <Button fullWidth color="inherit" startIcon={<UploadSimple />} onClick={onPick} sx={{ bgcolor: "chat.field" }}>
          {photo ? "Change photo" : "Upload a photo"}
        </Button>
        {photo && (
          <Button fullWidth color="error" startIcon={<Trash />} onClick={onRemovePhoto} sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) }}>
            Remove photo
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

// the profile above is the preview, so every pick shows at once and saves with the rest of the form
const CoverPicker = ({ coverStyle, photo, onStyleChange, onPhotoChange }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const [anchor, setAnchor] = useState(null);
  const { pick, picker } = useCroppedImage("cover", onPhotoChange);
  const close = () => setAnchor(null);

  const choices = (
    <CoverChoices
      coverStyle={coverStyle}
      photo={photo}
      onStyleChange={onStyleChange}
      onPick={() => {
        close();
        pick();
      }}
      onRemovePhoto={() => onPhotoChange("")}
    />
  );

  return (
    <>
      {isPhone ? (
        <IconButton aria-label="Edit cover" onClick={(event) => setAnchor(event.currentTarget)} sx={(theme) => ({ ...onCover(theme), width: 40, height: 40 })}>
          <Palette size={20} weight="bold" />
        </IconButton>
      ) : (
        <Button startIcon={<Palette weight="bold" />} onClick={(event) => setAnchor(event.currentTarget)} sx={onCover}>
          Edit cover
        </Button>
      )}

      {isPhone ? (
        <Drawer
          anchor="bottom"
          open={Boolean(anchor)}
          onClose={close}
          ModalProps={{ slotProps: { backdrop: { invisible: true } } }}
          PaperProps={{ "aria-label": "Cover", sx: { maxHeight: "70dvh", p: 2.5, pb: 3, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundImage: "none" } }}
        >
          {choices}
        </Drawer>
      ) : (
        <Popover
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ "aria-label": "Cover", sx: { width: 360, mt: 1, p: 2, borderRadius: 2, backgroundImage: "none" } }}
        >
          {choices}
        </Popover>
      )}

      {picker}
    </>
  );
};

export default CoverPicker;
