import { useEffect, useState } from "react";
import { ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, m } from "framer-motion";
import { useSelector } from "react-redux";

import ReactionList from "@/sections/chat/messages/ReactionList";
import { rankedReactions } from "@/utils/reactions";

const SHOWN = 3;
const HEIGHT = 30;
const OVERLAP = 7;

// how far the pill hangs below what it sits under, so that room can be kept free for it
export const REACTIONS_DROP = HEIGHT - OVERLAP;

const POP = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.3, opacity: 0 },
  transition: { type: "spring", stiffness: 520, damping: 26 },
};

// the ring takes the canvas colour, so the pill reads as cut out of the bubble's edge
const pillStyle = (hasMine) => (theme) => ({
  height: HEIGHT,
  px: 0.75,
  gap: "2px",
  borderRadius: 99,
  border: `2px solid ${theme.palette.chat.canvas}`,
  bgcolor: theme.palette.chat.raised,
  color: theme.palette.text.secondary,
  boxShadow: hasMine ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.55)}` : `0 1px 2px ${theme.palette.chat.shade}`,
  fontSize: 16,
  lineHeight: 1,
  zIndex: 1,
  "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
});

const Reactions = ({ reactions, conversation, mine, side = "left", inset = 0, onReact, onRemove, sx }) => {
  const meId = useSelector((state) => state.user.user._id);
  const [listAnchor, setListAnchor] = useState(null);
  const emojis = rankedReactions(reactions).slice(0, SHOWN).map(({ emoji }) => emoji);
  const total = reactions.length;
  const hasMine = reactions.some((reaction) => reaction.user === meId);

  useEffect(() => {
    if (!total) setListAnchor(null);
  }, [total]);

  return (
    <>
      <AnimatePresence initial={false}>
        {total > 0 && (
          <ButtonBase
            key="pill"
            component={m.button}
            {...POP}
            whileTap={{ scale: 0.94 }}
            onClick={(event) => setListAnchor(event.currentTarget)}
            aria-haspopup="dialog"
            aria-expanded={Boolean(listAnchor)}
            aria-label={`${total} reaction${total === 1 ? "" : "s"}, ${emojis.join(" ")}. See who reacted`}
            sx={[pillStyle(hasMine), { position: "absolute", top: `calc(100% - ${OVERLAP}px)`, [side]: inset }, sx ?? {}]}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {emojis.map((emoji) => (
                <m.span key={emoji} {...POP} aria-hidden style={{ display: "inline-block" }}>
                  {emoji}
                </m.span>
              ))}
            </AnimatePresence>
            {total > 1 && (
              <Typography component="span" sx={{ ml: 0.5, fontSize: 13, fontWeight: 700, color: "inherit", fontVariantNumeric: "tabular-nums" }}>
                {total}
              </Typography>
            )}
          </ButtonBase>
        )}
      </AnimatePresence>
      <ReactionList
        anchorEl={listAnchor}
        side={side}
        reactions={reactions}
        conversation={conversation}
        mine={mine}
        onReact={onReact}
        onRemove={onRemove}
        onClose={() => setListAnchor(null)}
      />
    </>
  );
};

export default Reactions;
