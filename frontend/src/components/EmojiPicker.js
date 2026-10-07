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

const PICKER_SIZE = { width: 352, height: 435 };

const EmojiPicker = ({ onSelect, autoFocus = true }) => {
  const theme = useTheme();

  return (
    <Suspense
      fallback={
        <Box sx={{ ...PICKER_SIZE, display: "grid", placeItems: "center" }}>
          <CircularProgress size={24} aria-label="Loading emoji" />
        </Box>
      }
    >
      <Picker
        theme={theme.palette.mode}
        onEmojiSelect={(emoji) => onSelect(emoji.native)}
        previewPosition="none"
        skinTonePosition="search"
        autoFocus={autoFocus}
      />
    </Suspense>
  );
};

export default EmojiPicker;
