import { useState } from "react";
import { Box, Popover, Stack } from "@mui/material";
import { useSkinTone } from "frimousse";

import { markedSx, tappableSx } from "@/components/emoji-picker/emojiStyles";

const toneName = (skinTone) => (skinTone === "none" ? "Default skin tone" : `${skinTone.replace("-", " ")} skin tone`);

const SkinTonePicker = ({ skinTone, onChange }) => {
  const [anchor, setAnchor] = useState(null);
  const [, , variations] = useSkinTone();
  const current = variations.find((variation) => variation.skinTone === skinTone) ?? variations[0];

  const choose = (tone) => {
    onChange(tone);
    setAnchor(null);
  };

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label="Choose skin tone"
        aria-haspopup="true"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ ...tappableSx, fontSize: 20 }}
      >
        {current.emoji}
      </Box>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ paper: { sx: { borderRadius: 99, mb: 1, p: 0.5 } } }}
      >
        <Stack direction="row" role="group" aria-label="Skin tone" sx={{ gap: 0.25 }}>
          {variations.map((variation) => (
            <Box
              component="button"
              type="button"
              key={variation.skinTone}
              aria-label={toneName(variation.skinTone)}
              aria-pressed={variation.skinTone === current.skinTone}
              onClick={() => choose(variation.skinTone)}
              sx={(theme) => ({
                ...tappableSx,
                width: 40,
                height: 40,
                borderRadius: "50%",
                fontSize: 22,
                ...(variation.skinTone === current.skinTone && markedSx(theme)),
              })}
            >
              {variation.emoji}
            </Box>
          ))}
        </Stack>
      </Popover>
    </>
  );
};

export default SkinTonePicker;
