import { Suspense, lazy } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";

// the emoji data is large, so it loads the first time a picker opens rather than with the app
const Picker = lazy(async () => {
  const [{ default: data }, { default: EmojiMart }] = await Promise.all([import("@emoji-mart/data"), import("@emoji-mart/react")]);
  return { default: (props) => <EmojiMart data={data} {...props} /> };
});

const EMOJI_BUTTON = 36;
const MAX_PER_LINE = 9;
// the picker's own padding and side bar, plus the popover's border
const PICKER_CHROME = 30;
// a popover keeps 16px clear of each edge of the screen
const SCREEN_MARGINS = 32;
const PICKER_HEIGHT = 435;

const EmojiPicker = ({ onSelect, autoFocus = true, isPanel = false }) => {
  const theme = useTheme();
  const perLine = Math.min(MAX_PER_LINE, Math.floor((window.innerWidth - SCREEN_MARGINS - PICKER_CHROME) / EMOJI_BUTTON));

  return (
    <Suspense
      fallback={
        <Box
          sx={{
            width: isPanel ? "100%" : perLine * EMOJI_BUTTON + PICKER_CHROME,
            height: isPanel ? "100%" : PICKER_HEIGHT,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress size={24} aria-label="Loading emoji" />
        </Box>
      }
    >
      <Box sx={isPanel ? { height: "100%", "& > div, & em-emoji-picker": { width: "100%", height: "100%" } } : undefined}>
        <Picker
          theme={theme.palette.mode}
          onEmojiSelect={(emoji) => onSelect(emoji.native)}
          perLine={perLine}
          emojiButtonSize={EMOJI_BUTTON}
          previewPosition="none"
          skinTonePosition="search"
          autoFocus={autoFocus}
          {...(isPanel && { dynamicWidth: true, navPosition: "bottom", maxFrequentRows: 1 })}
        />
      </Box>
    </Suspense>
  );
};

export default EmojiPicker;
