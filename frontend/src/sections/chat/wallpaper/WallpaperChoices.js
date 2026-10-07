import { useId } from "react";
import { Box, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Check } from "phosphor-react";

import useSettings from "@/hooks/useSettings";
import { WallpaperLayers } from "@/sections/chat/ChatCanvas";
import { WALLPAPERS, colorsOf, wallpaperById } from "@/sections/chat/wallpaper/wallpapers";
import { gradientOf } from "@/utils/gradients";

const hiddenInput = { position: "absolute", opacity: 0, width: "1px", height: "1px", m: 0 };

const Preview = ({ colors, doodles }) => (
  <Box sx={{ position: "relative", isolation: "isolate", overflow: "hidden", width: "100%", aspectRatio: "3 / 4", borderRadius: 3.5, bgcolor: "chat.canvas" }}>
    <WallpaperLayers colors={colors} doodles={doodles} doodleSize={180} isSwatch />
    <Stack spacing={0.75} sx={{ position: "absolute", inset: 0, p: 1.25, justifyContent: "flex-end" }}>
      <Box sx={{ width: "62%", height: 14, borderRadius: 2, bgcolor: "chat.bubbleIn" }} />
      <Box sx={{ width: "48%", height: 14, borderRadius: 2, alignSelf: "flex-end", background: (theme) => gradientOf(theme.palette.primary.bubble) }} />
    </Stack>
  </Box>
);

// chosenId is null when a chat follows the wallpaper every chat uses, which is offered as its own first choice
const WallpaperChoices = ({ chosenId, onChoose, offersDefault = false, action }) => {
  const groupName = useId();
  const { palette } = useTheme();
  const { wallpapers, onToggleDoodles } = useSettings();
  const choices = offersDefault ? [{ id: null, label: "Default" }, ...WALLPAPERS] : WALLPAPERS;

  return (
    <Stack spacing={2}>
      <Box role="radiogroup" aria-label="Wallpaper" sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 1.5 }}>
        {choices.map(({ id, label }) => {
          const isChosen = chosenId === id;
          return (
            <Box component="label" key={id ?? "default"} sx={{ position: "relative", display: "flex", flexDirection: "column", gap: 0.75, p: 0.5, cursor: "pointer" }}>
              <Box component="input" type="radio" name={groupName} checked={isChosen} onChange={() => onChoose(id)} aria-label={label} sx={hiddenInput} />
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 3.5,
                  boxShadow: (theme) => (isChosen ? `0 0 0 2.5px ${theme.palette.primary.main}` : `0 0 0 1px ${theme.palette.divider}`),
                  "input:focus-visible + &": { outline: 2, outlineColor: "primary.main", outlineOffset: 3 },
                }}
              >
                <Preview colors={colorsOf(wallpaperById(id ?? wallpapers.all), palette)} doodles={wallpapers.doodles} />
                {isChosen && (
                  <Box sx={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText" }}>
                    <Check size={13} weight="bold" />
                  </Box>
                )}
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: isChosen ? 800 : 600, textAlign: "center" }}>{label}</Typography>
            </Box>
          );
        })}
      </Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FormControlLabel
          control={<Switch checked={wallpapers.doodles} onChange={onToggleDoodles} />}
          label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>Show doodles</Typography>}
        />
        {action}
      </Stack>
    </Stack>
  );
};

export default WallpaperChoices;
