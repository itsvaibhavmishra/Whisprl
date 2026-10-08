import { Box, ButtonBase, IconButton, Slider, Stack, Tooltip } from "@mui/material";

import { COLORS } from "@/utils/media-editor/palette";

export const ToolButton = ({ label, isPressed, onClick, disabled, children }) => (
  <Tooltip title={label}>
    <span>
      <IconButton
        aria-label={label}
        aria-pressed={isPressed}
        onClick={onClick}
        disabled={disabled}
        sx={{
          color: "#fff",
          bgcolor: isPressed ? "rgba(255, 255, 255, 0.24)" : "transparent",
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.16)" },
          "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.35)" },
        }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

export const ColorRow = ({ value, onChange }) => (
  <Stack direction="row" spacing={1.25} justifyContent="center" sx={{ px: 2, py: 1.25 }}>
    {COLORS.map((color) => (
      <ButtonBase
        key={color.name}
        aria-label={color.name}
        aria-pressed={value === color.value}
        onClick={() => onChange(color.value)}
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: color.value,
          border: "2px solid #fff",
          transform: value === color.value ? "scale(1.25)" : "none",
          transition: "transform 120ms",
        }}
      />
    ))}
  </Stack>
);

export const SizeSlider = ({ label, value, min, max, onChange }) => (
  <Box sx={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", height: "40%", maxHeight: 280, zIndex: 1 }}>
    <Slider
      orientation="vertical"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={(max - min) / 100}
      onChange={(_, next) => onChange(next)}
      sx={{ color: "#fff", width: 6, "& .MuiSlider-thumb": { width: 24, height: 24, boxShadow: "0 1px 6px rgba(0, 0, 0, 0.45)" }, "& .MuiSlider-rail": { opacity: 0.45 } }}
    />
  </Box>
);
