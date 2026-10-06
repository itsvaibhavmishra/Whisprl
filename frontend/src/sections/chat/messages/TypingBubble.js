import { Stack, Typography, useTheme } from "@mui/material";
import BeatLoader from "react-spinners/BeatLoader";

import { listOf } from "@/utils/groups";

export const TYPING_BUBBLE_HEIGHT = 40;

const TypingBubble = ({ names, isGroup }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      role="status"
      aria-label={`${listOf(names)} ${names.length === 1 ? "is" : "are"} typing`}
      sx={{ alignSelf: "flex-start", height: TYPING_BUBBLE_HEIGHT, px: 1.75, borderRadius: "20px", bgcolor: "background.default" }}
    >
      {isGroup && (
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
          {listOf(names)}
        </Typography>
      )}
      <BeatLoader size={5} color={theme.palette.primary.main} speedMultiplier={0.5} margin={2} />
    </Stack>
  );
};

export default TypingBubble;
