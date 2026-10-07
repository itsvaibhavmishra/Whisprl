import { Box } from "@mui/material";
import { Check, Checks, Clock } from "phosphor-react";

import useSettings from "@/hooks/useSettings";
import { formatClock } from "@/utils/formatMessageTime";

const SEEN_ON_GRADIENT = "#B9F1FF";
const DIM_ON_GRADIENT = "rgba(255, 255, 255, 0.6)";

// on the gradient, seen is the one bright tick, so it stands apart from sent and delivered at a glance
const Tick = ({ message, isQueued, isOnBubble }) => {
  const dim = isOnBubble ? DIM_ON_GRADIENT : "currentColor";
  if (isQueued) return <Clock size={12} weight="bold" role="img" aria-label="Sending" color={dim} />;
  if (message.seenAt) return <Checks size={15} weight="bold" role="img" aria-label="Seen" color={isOnBubble ? SEEN_ON_GRADIENT : "currentColor"} />;
  if (message.deliveredAt) return <Checks size={15} role="img" aria-label="Delivered" color={dim} />;
  return <Check size={14} role="img" aria-label="Sent" color={dim} />;
};

const Stamp = ({ message, hasTick, isQueued, isOnBubble }) => {
  const { use24Hour } = useSettings();
  return (
    <>
      {message.editedAt && <span>Edited</span>}
      <span>{formatClock(message.createdAt, use24Hour)}</span>
      {hasTick && <Tick message={message} isQueued={isQueued} isOnBubble={isOnBubble} />}
    </>
  );
};

const STAMP_TEXT = { display: "inline-flex", alignItems: "center", gap: "4px", fontSize: 11, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };

const PLACES = {
  float: { position: "absolute", right: 10, bottom: 7 },
  overlay: { position: "absolute", right: 8, bottom: 8, px: 0.75, py: 0.5, borderRadius: 99, color: "#fff", bgcolor: "rgba(6, 12, 22, 0.55)" },
  block: { alignSelf: "flex-end", mt: 0.5 },
  inline: { ml: "auto" },
};

const MessageMeta = ({ message, hasTick, isQueued, isOnBubble, isMine, place, sx }) => (
  <Box component="span" sx={{ ...STAMP_TEXT, color: isMine ? "rgba(255, 255, 255, 0.9)" : "text.secondary", ...PLACES[place], ...sx }}>
    <Stamp message={message} hasTick={hasTick} isQueued={isQueued} isOnBubble={isOnBubble} />
  </Box>
);

// an invisible copy at the end of the text keeps room for the stamp floating over the last line
export const MetaSpacer = (props) => (
  <Box component="span" aria-hidden sx={{ ...STAMP_TEXT, visibility: "hidden", ml: 1.25, verticalAlign: "baseline" }}>
    <Stamp {...props} />
  </Box>
);

export default MessageMeta;
