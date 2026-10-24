import { useEffect, useRef, useState } from "react";
import { Badge, Box, IconButton, Tooltip, Zoom } from "@mui/material";
import { ArrowDown } from "phosphor-react";

const JumpToLatest = ({ watchAway, hasNewerMessages, conversationId, lastArrival, onJump }) => {
  const [isAway, setIsAway] = useState(false);
  const [missed, setMissed] = useState(0);
  const countedArrival = useRef({ conversationId: null, messageId: null });

  useEffect(() => watchAway(setIsAway), [watchAway]);

  // counts what arrives from others while the reader is scrolled up, so the button can say what they missed
  useEffect(() => {
    const counted = countedArrival.current;
    const isNewArrival = counted.conversationId === conversationId && counted.messageId !== lastArrival;
    countedArrival.current = { conversationId, messageId: lastArrival };
    if (!isAway) setMissed(0);
    else if (isNewArrival) setMissed((count) => count + 1);
  }, [conversationId, lastArrival, isAway]);

  const label = missed ? `${missed} new message${missed === 1 ? "" : "s"}` : "Jump to latest";

  return (
    <Zoom in={isAway || hasNewerMessages} unmountOnExit>
      <Box sx={{ position: "absolute", right: { xs: 12, md: 24 }, bottom: 12 }}>
        <Tooltip title={label} placement="left">
          <IconButton
            onClick={onJump}
            aria-label={label}
            sx={{
              width: 44,
              height: 44,
              color: "text.primary",
              bgcolor: "chat.raised",
              boxShadow: (theme) => `0 6px 20px -6px ${theme.palette.chat.shade}, 0 0 0 1px ${theme.palette.divider}`,
              "&:hover": { bgcolor: "chat.raised", color: "primary.main" },
            }}
          >
            <Badge badgeContent={missed} color="primary" sx={{ "& .MuiBadge-badge": { top: -10, right: -10, fontWeight: 800 } }}>
              <ArrowDown size={20} weight="bold" />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>
    </Zoom>
  );
};

export default JumpToLatest;
