import { Box, ButtonBase } from "@mui/material";
import { alpha } from "@mui/material/styles";

const PillGroup = ({ label, options, value, onChange }) => (
  <Box role="group" aria-label={label} sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", sm: `repeat(${options.length}, auto)` } }}>
    {options.map((option) => {
      const isCurrent = option.value === value;
      return (
        <ButtonBase
          key={option.value}
          aria-pressed={isCurrent}
          onClick={() => onChange(option.value)}
          sx={{
            px: 1.5,
            height: 36,
            borderRadius: 2,
            border: 1,
            fontSize: 13.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            borderColor: isCurrent ? "primary.main" : "divider",
            color: isCurrent ? "primary.main" : "text.secondary",
            bgcolor: isCurrent ? (theme) => alpha(theme.palette.primary.main, 0.12) : "transparent",
            "&:hover": { borderColor: isCurrent ? "primary.main" : "text.secondary" },
            "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main" },
          }}
        >
          {option.label}
        </ButtonBase>
      );
    })}
  </Box>
);

export default PillGroup;
