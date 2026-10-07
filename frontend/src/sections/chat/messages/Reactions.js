import { useEffect, useState } from "react";
import { ButtonBase, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, m } from "framer-motion";

import { firstNameIn, listOf } from "@/utils/groups";
import { tallyReactions } from "@/utils/reactions";

const SHOWN = 2;

export const chipCountOf = (reactions) => Math.min(tallyReactions(reactions).length, SHOWN + 1);

const POP = {
  initial: { scale: 0.3, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.3, opacity: 0 },
  whileHover: { scale: 1.08 },
  transition: { type: "spring", stiffness: 520, damping: 26 },
};

const chipStyle = (hasMine) => (theme) => ({
  gap: 0.5,
  px: 0.75,
  minHeight: 26,
  borderRadius: 99,
  fontSize: 14,
  lineHeight: 1.4,
  bgcolor: theme.palette.chat.raised,
  backgroundImage: hasMine ? `linear-gradient(${alpha(theme.palette.primary.main, 0.22)}, ${alpha(theme.palette.primary.main, 0.22)})` : "none",
  boxShadow: `0 1px 3px ${theme.palette.chat.shade}, inset 0 0 0 1px ${hasMine ? alpha(theme.palette.primary.main, 0.6) : theme.palette.chat.edge}`,
  "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
});

const Count = ({ value, hasMine }) => (
  <Typography component="span" sx={{ fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: hasMine ? "primary.main" : "text.secondary" }}>
    {value}
  </Typography>
);

const Reactions = ({ message, conversation, meId, isBare, onReact }) => {
  const [listAnchor, setListAnchor] = useState(null);
  const tally = tallyReactions(message.reactions).sort((one, other) => other.users.length - one.users.length);
  const shown = tally.slice(0, SHOWN);
  const foldedCount = tally.length - shown.length;
  // the chips move only when what they show changes, so a scroll or swipe never sets them drifting after their bubble
  const rowKey = `${shown.map(({ emoji, users }) => `${emoji}:${users.length}`).join()}|${foldedCount}`;

  useEffect(() => {
    if (!foldedCount) setListAnchor(null);
  }, [foldedCount]);

  const namesOf = (users) => listOf(users.map((userId) => firstNameIn(conversation, userId, meId)));
  const react = (emoji) => {
    setListAnchor(null);
    onReact(emoji);
  };

  return (
    <>
      <Stack direction="row" sx={{ position: "absolute", top: isBare ? -22 : -13, right: isBare ? 0 : 12, gap: 0.5, zIndex: 1 }}>
        {/* the old reaction leaves the row at once, so a changed one swaps in place instead of sliding past it */}
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map(({ emoji, users }) => {
            const hasMine = users.includes(meId);
            return (
              <Tooltip key={emoji} title={namesOf(users)}>
                <ButtonBase
                  component={m.button}
                  layout="position"
                  layoutDependency={rowKey}
                  {...POP}
                  onClick={() => onReact(emoji)}
                  aria-pressed={hasMine}
                  aria-label={`${emoji} from ${namesOf(users)}`}
                  sx={chipStyle(hasMine)}
                >
                  <span aria-hidden>{emoji}</span>
                  {users.length > 1 && <Count value={users.length} hasMine={hasMine} />}
                </ButtonBase>
              </Tooltip>
            );
          })}
          {foldedCount > 0 && (
            <ButtonBase
              key="more"
              component={m.button}
              layout="position"
              layoutDependency={rowKey}
              {...POP}
              onClick={(event) => setListAnchor(event.currentTarget)}
              aria-haspopup="true"
              aria-expanded={Boolean(listAnchor)}
              aria-label={`${foldedCount} more reaction${foldedCount === 1 ? "" : "s"}, see everyone's`}
              sx={chipStyle(false)}
            >
              <Count value={`+${foldedCount}`} />
            </ButtonBase>
          )}
        </AnimatePresence>
      </Stack>

      <Popover
        open={Boolean(listAnchor)}
        anchorEl={listAnchor}
        onClose={() => setListAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 0.75, p: 0.75, minWidth: 220, maxWidth: 300 } } }}
      >
        <Stack role="group" aria-label="Reactions" spacing={0.25}>
          {tally.map(({ emoji, users }) => {
            const hasMine = users.includes(meId);
            return (
              <ButtonBase
                key={emoji}
                onClick={() => react(emoji)}
                aria-pressed={hasMine}
                aria-label={`${emoji} from ${namesOf(users)}`}
                sx={{
                  gap: 1.25,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 2,
                  justifyContent: "flex-start",
                  textAlign: "left",
                  bgcolor: (theme) => (hasMine ? alpha(theme.palette.primary.main, 0.14) : "transparent"),
                  "&:hover, &.Mui-focusVisible": { bgcolor: "action.hover" },
                }}
              >
                <span aria-hidden style={{ fontSize: 20 }}>
                  {emoji}
                </span>
                <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600 }}>
                  {namesOf(users)}
                </Typography>
                <Count value={users.length} hasMine={hasMine} />
              </ButtonBase>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
};

export default Reactions;
