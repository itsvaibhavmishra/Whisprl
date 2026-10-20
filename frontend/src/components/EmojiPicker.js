import { Suspense, lazy } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";

// the emoji data is large, so it loads the first time a picker opens rather than with the app
const Picker = lazy(async () => {
  const [{ default: data }, { default: EmojiMart }] = await Promise.all([
    import("@emoji-mart/data"),
    import("@emoji-mart/react"),
  ]);
  return { default: (props) => <EmojiMart data={data} {...props} /> };
});

const EMOJI_BUTTON = 36;
const MAX_PER_LINE = 9;
// the picker's own padding and side bar, plus the popover's border
const PICKER_CHROME = 30;
// a popover keeps 16px clear of each edge of the screen
const SCREEN_MARGINS = 32;
const PICKER_HEIGHT = 435;

const EmojiPicker = ({ onSelect, autoFocus = true }) => {
  const theme = useTheme();
  const perLine = Math.min(MAX_PER_LINE, Math.floor((window.innerWidth - SCREEN_MARGINS - PICKER_CHROME) / EMOJI_BUTTON));

  return (
    <Suspense
      fallback={
        <Box sx={{ width: perLine * EMOJI_BUTTON + PICKER_CHROME, height: PICKER_HEIGHT, display: "grid", placeItems: "center" }}>
          <CircularProgress size={24} aria-label="Loading emoji" />
        </Box>
      }
    >
      <Picker
        theme={theme.palette.mode}
        onEmojiSelect={(emoji) => onSelect(emoji.native)}
        perLine={perLine}
        emojiButtonSize={EMOJI_BUTTON}
        previewPosition="none"
        skinTonePosition="search"
        autoFocus={autoFocus}
      />
    </Suspense>
  );
};

export default EmojiPicker;
