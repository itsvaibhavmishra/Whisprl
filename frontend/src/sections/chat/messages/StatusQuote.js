import { useCallback, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { Globe } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { GetDiscover } from "@/redux/slices/actions/statusActions";
import StatusViewer from "@/sections/status/StatusViewer";
import { notify } from "@/utils/notify";
import { isLive } from "@/utils/statuses";

const labelOf = (quote, isMine) => {
  if (quote.about === "mention") return isMine ? "You mentioned them in your status" : "Mentioned you in their status";
  if (quote.about === "share") return isMine ? `You shared ${quote.ownerName}'s status` : `Shared ${quote.ownerName}'s status`;
  return isMine ? "You replied to their status" : "Replied to your status";
};

const quiet = { m: 0, px: 0.5, fontSize: 12.5, fontWeight: 500, color: "text.secondary" };

const isQuoted = (quote) => (status) => status._id === quote._id;

const StatusQuote = ({ quote, isMine }) => {
  const dispatch = useDispatch();
  const [isViewing, setIsViewing] = useState(false);
  const known = useSelector((state) => state.status.statuses.find(isQuoted(quote)) ?? state.status.discover.find(isQuoted(quote)));
  // a shared card carries no preview of its own, so it borrows one only from updates the server already lets this viewer see
  const preview = quote.preview ?? known?.content.file?.preview;
  const closeViewer = useCallback(() => setIsViewing(false), []);
  const isAvailable = isLive(quote);
  const label = labelOf(quote, isMine);

  // an update shared from beyond your friends lives in Discover, which only the Status page loads
  const open = async (event) => {
    event.stopPropagation();
    if (!known) {
      const { payload } = await dispatch(GetDiscover());
      if (!payload?.some(isQuoted(quote))) {
        notify({ severity: "info", message: "This status is no longer available" });
        return;
      }
    }
    setIsViewing(true);
  };

  return (
    <Stack alignItems={isMine ? "flex-end" : "flex-start"} spacing={0.75} sx={{ mb: 0.75 }}>
      <Typography component="p" sx={quiet}>
        {label}
      </Typography>
      <Stack direction={isMine ? "row" : "row-reverse"} spacing={1} alignItems="stretch">
        {isAvailable ? (
          <ButtonBase
            onClick={open}
            aria-label={`${label}. Open it`}
            sx={{
              width: 112,
              aspectRatio: "9 / 16",
              display: "grid",
              placeItems: "center",
              borderRadius: 2.5,
              overflow: "hidden",
              color: "text.secondary",
              bgcolor: "chat.field",
              "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 2 },
            }}
          >
            {preview ? <Box component="img" src={preview} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <Globe size={28} aria-hidden />}
          </ButtonBase>
        ) : (
          <Typography component="p" aria-label={`${label}. No longer available`} sx={{ ...quiet, alignSelf: "center" }}>
            Status unavailable
          </Typography>
        )}
        <Box aria-hidden sx={{ width: 4, flexShrink: 0, borderRadius: 99, bgcolor: "divider" }} />
      </Stack>
      {isViewing && (
        // keys and clicks inside the player stay there, so they never reach the chat around it
        <Box onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} sx={{ display: "contents" }}>
          <StatusViewer ownerIds={[quote.ownerId]} startOwnerId={quote.ownerId} startStatusId={quote._id} onClose={closeViewer} />
        </Box>
      )}
    </Stack>
  );
};

export default StatusQuote;
