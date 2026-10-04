import { Box, Stack, Typography } from "@mui/material";
import { Check } from "phosphor-react";

import useSettings from "@/hooks/useSettings";
import palette from "@/theme/palette";
import { colorPresets } from "@/utils/getColorPresets";

export const MODES = {
  light: { label: "Light", phrase: "in light mode" },
  dark: { label: "Dark", phrase: "in dark mode" },
  system: { label: "System", phrase: "matching my device" },
};

export const ACCENT_NAMES = {
  default: "Whisprl blue",
  purple: "Purple",
  cyan: "Cyan",
  blue: "Deep blue",
  orange: "Orange",
  red: "Red",
};

const hiddenInput = { position: "absolute", opacity: 0, width: 1, height: 1, m: 0 };

const focusRing = {
  "input:focus-visible + &": { outline: 2, outlineColor: "primary.main", outlineOffset: 3 },
};

const { light, dark } = palette;

const TILE_BACKGROUND = {
  light: light.background.default,
  dark: dark.background.default,
  system: `linear-gradient(135deg, ${light.background.default} 50%, ${dark.background.default} 50%)`,
};

const INCOMING_BUBBLE = {
  light: light.grey[300],
  dark: dark.grey[700],
  system: `linear-gradient(90deg, ${light.grey[300]} 50%, ${dark.grey[700]} 50%)`,
};

const PickerLabel = ({ id, children, detail }) => (
  <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1.5 }}>
    <Typography id={id} sx={{ fontWeight: 600 }}>
      {children}
    </Typography>
    {detail && (
      <Typography variant="body2" color="text.secondary">
        {detail}
      </Typography>
    )}
  </Stack>
);

export const ThemeModePicker = () => {
  const { themeMode, onChangeMode } = useSettings();

  return (
    <Box>
      <PickerLabel id="theme-label">Theme</PickerLabel>
      <Stack role="radiogroup" aria-labelledby="theme-label" direction="row" spacing={1.5}>
        {Object.entries(MODES).map(([value, { label }]) => {
          const checked = themeMode === value;
          return (
            <Box component="label" key={value} sx={{ position: "relative", cursor: "pointer", textAlign: "center", flex: "0 1 112px" }}>
              <Box component="input" type="radio" name="theme-mode" value={value} checked={checked} onChange={onChangeMode} sx={hiddenInput} />
              <Stack
                spacing={0.75}
                justifyContent="center"
                sx={{
                  ...focusRing,
                  height: 72,
                  px: 1.5,
                  borderRadius: 2.5,
                  border: 2,
                  borderColor: checked ? "primary.main" : "divider",
                  background: TILE_BACKGROUND[value],
                }}
              >
                <Box sx={{ width: "64%", height: 12, borderRadius: 6, background: INCOMING_BUBBLE[value] }} />
                <Box sx={{ width: "46%", height: 12, borderRadius: 6, bgcolor: "primary.main", alignSelf: "flex-end" }} />
              </Stack>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: checked ? 700 : 400 }}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

export const AccentPicker = () => {
  const { themeColorPresets, onChangeColor } = useSettings();

  return (
    <Box>
      <PickerLabel id="accent-label" detail={ACCENT_NAMES[themeColorPresets]}>
        Accent colour
      </PickerLabel>
      <Stack role="radiogroup" aria-labelledby="accent-label" direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {colorPresets.map(({ name, main, contrastText }) => {
          const checked = themeColorPresets === name;
          return (
            <Box component="label" key={name} title={ACCENT_NAMES[name]} sx={{ position: "relative", cursor: "pointer" }}>
              <Box
                component="input"
                type="radio"
                name="accent-colour"
                value={name}
                checked={checked}
                onChange={onChangeColor}
                aria-label={ACCENT_NAMES[name]}
                sx={hiddenInput}
              />
              <Box
                sx={{
                  ...focusRing,
                  display: "grid",
                  placeItems: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  bgcolor: main,
                  color: contrastText,
                  boxShadow: (theme) => (checked ? `0 0 0 3px ${theme.palette.background.default}, 0 0 0 5px ${main}` : "none"),
                }}
              >
                {checked && <Check size={18} weight="bold" />}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
