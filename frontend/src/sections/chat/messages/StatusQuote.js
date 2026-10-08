import { Box, ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { isLive, statusLinkOf } from "@/utils/statuses";

const labelOf = (quote, isMine) => {
  if (quote.isMention) return isMine ? "You mentioned them in your status" : "Mentioned you in their status";
  return isMine ? "You replied to their status" : "Replied to your status";
};

const StatusQuote = ({ quote, isMine }) => {
  const navigate = useNavigate();
  const isAvailable = isLive(quote);
  const label = labelOf(quote, isMine);

  return (
    <ButtonBase
      disabled={!isAvailable}
      onClick={(event) => {
        event.stopPropagation();
        navigate(statusLinkOf(quote.ownerId, quote._id));
      }}
      aria-label={isAvailable ? `${label}. Open it` : `${label}. No longer available`}
      sx={{
        gap: 1.25,
        p: 0.75,
        pr: 1.5,
        mb: 0.5,
        borderRadius: 2,
        justifyContent: "flex-start",
        textAlign: "left",
        bgcolor: (theme) => (isMine ? alpha("#fff", 0.16) : alpha(theme.palette.primary.main, 0.1)),
      }}
    >
      <Box sx={{ width: 44, height: 78, flexShrink: 0, borderRadius: 1.5, overflow: "hidden", bgcolor: "rgba(0, 0, 0, 0.25)" }}>
        {quote.preview && <Box component="img" src={quote.preview} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: isAvailable ? 1 : 0.5 }} />}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" component="p" sx={{ m: 0, fontWeight: 700 }}>
          {label}
        </Typography>
        {!isAvailable && (
          <Typography variant="caption" component="p" sx={{ m: 0, opacity: 0.75 }}>
            No longer available
          </Typography>
        )}
      </Box>
    </ButtonBase>
  );
};

export default StatusQuote;
