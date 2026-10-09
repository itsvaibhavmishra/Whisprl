import { Stack, Typography } from "@mui/material";
import { Globe } from "phosphor-react";

import { SPOKEN_ONLY } from "@/utils/spokenOnly";

// friends is the usual audience, so only the wider one is ever marked
const EveryonePill = ({ isOnMedia = false }) => (
  <Stack
    direction="row"
    spacing={0.5}
    alignItems="center"
    sx={{
      flexShrink: 0,
      px: 0.875,
      py: 0.25,
      borderRadius: 99,
      color: isOnMedia ? "#fff" : "text.secondary",
      bgcolor: isOnMedia ? "rgba(255, 255, 255, 0.18)" : "action.selected",
    }}
  >
    <Globe size={12} weight="bold" aria-hidden />
    {/* where its container is narrow the word is left to screen readers, so the name beside it keeps its room */}
    <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4, "@container (max-width: 340px)": SPOKEN_ONLY }}>
      Everyone
    </Typography>
  </Stack>
);

export default EveryonePill;
