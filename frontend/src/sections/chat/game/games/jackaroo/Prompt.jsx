import { ButtonBase, Stack, Typography } from "@mui/material";

import FONTS from "@/sections/chat/game/games/jackaroo/fonts";

const BUTTON = { flexShrink: 0, pointerEvents: "auto", fontFamily: FONTS.body, fontWeight: 700, color: "#fff", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.45)" };
const GREEN = "linear-gradient(180deg, #4cc16a 0%, #2e9d4a 100%)";
const LOOKS = {
  choice: { ...BUTTON, px: 2, py: 0.6, borderRadius: 99, fontSize: 14, background: GREEN },
  steps: { ...BUTTON, width: 36, height: 36, borderRadius: "11px", fontFamily: FONTS.display, fontSize: 18, background: GREEN },
  all: { ...BUTTON, px: 2.5, py: 0.6, borderRadius: 99, fontSize: 15, color: "#3b1d0e", background: "linear-gradient(180deg, #ffd889 0%, #f0b860 100%)" },
};

// what the turn still needs from you, floated just above your cards and centred over them; a watcher's line gets its own row
const Prompt = ({ text, isAlarm = false, buttons = [], isOverHand }) => (
  <Stack
    spacing={1}
    sx={[
      { alignItems: "center" },
      isOverHand
        ? {
            position: "absolute",
            zIndex: 3,
            bottom: "calc(100% - 12px)",
            left: "50%",
            width: "max-content",
            maxWidth: "calc(100cqw - 16px)",
            translate: "-50% 0",
            pointerEvents: "none",
          }
        : { minHeight: 40, justifyContent: "center", px: 2, flexShrink: 0 },
    ]}
  >
    {text && (
      <Typography
        aria-live="polite"
        sx={{
          px: 1.5,
          py: 0.4,
          borderRadius: 99,
          bgcolor: "rgba(20, 12, 8, 0.85)",
          color: isAlarm ? "#ff7a6b" : "#f6ebdd",
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 14.5,
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
        }}
      >
        {text}
      </Typography>
    )}
    {buttons.length > 0 && (
      <Stack direction="row" sx={{ justifyContent: "center", flexWrap: "wrap", gap: 1 }}>
        {buttons.map(({ label, look, onClick }) => (
          <ButtonBase key={label} onClick={onClick} sx={LOOKS[look]}>
            {label}
          </ButtonBase>
        ))}
      </Stack>
    )}
  </Stack>
);

export default Prompt;
