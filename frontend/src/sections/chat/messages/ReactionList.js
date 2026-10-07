import { useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Plus, Smiley } from "phosphor-react";
import { useSelector } from "react-redux";

import MediaTile from "@/sections/chat/messages/MediaTile";
import ReactionPicker from "@/sections/chat/messages/ReactionPicker";
import getAvatar from "@/utils/avatars";
import { memberOf } from "@/utils/groups";
import { filesOf } from "@/utils/messageFiles";
import { rankedReactions } from "@/utils/reactions";

const fullNameOf = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Someone";

const keyOfReaction = (reaction) => `${reaction.user}:${reaction.emoji}:${reaction.message?._id ?? ""}:${Boolean(reaction.isForAlbum)}`;

const chipStyle = (isMine) => (theme) => ({
  flexShrink: 0,
  height: 36,
  px: 1.75,
  gap: 0.75,
  borderRadius: 99,
  fontSize: 14,
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: isMine ? theme.palette.primary.main : theme.palette.text.secondary,
  bgcolor: isMine ? alpha(theme.palette.primary.main, 0.16) : theme.palette.action.hover,
  "&:hover": { bgcolor: isMine ? alpha(theme.palette.primary.main, 0.24) : theme.palette.action.selected },
  "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
});

const ReactionList = ({ anchorEl, side, reactions, conversation, mine, onReact, onRemove, onClose }) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const canHover = useMediaQuery("(hover: hover)");
  const meId = useSelector((state) => state.user.user._id);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const heading = useRef(null);
  const tally = rankedReactions(reactions);
  const rows = [...reactions].sort((one, other) => (other.user === meId) - (one.user === meId));
  const isOpen = Boolean(anchorEl);

  // the row goes with the reaction, so focus moves to the count rather than falling out of the sheet
  const remove = (reaction) => {
    heading.current?.focus();
    onRemove(reaction);
  };

  const content = (
    <>
      {isPhone && <Box aria-hidden sx={{ flexShrink: 0, width: 36, height: 4, mx: "auto", mt: 1.25, borderRadius: 2, bgcolor: "divider" }} />}
      <Typography ref={heading} tabIndex={-1} component="h2" sx={{ flexShrink: 0, px: 2.5, pt: 2, fontSize: 17, fontWeight: 700, outline: "none" }}>
        {reactions.length} reaction{reactions.length === 1 ? "" : "s"}
      </Typography>
      <Stack direction="row" sx={{ flexShrink: 0, gap: 1, px: 2.5, py: 1.5, overflowX: "auto", scrollbarWidth: "none" }}>
        <ButtonBase aria-label="Add a reaction" onClick={(event) => setPickerAnchor(event.currentTarget)} sx={[chipStyle(false), { px: 2.25 }]}>
          <Box sx={{ position: "relative", display: "flex" }}>
            <Smiley size={20} />
            <Plus size={9} weight="bold" style={{ position: "absolute", top: -3, right: -5 }} />
          </Box>
        </ButtonBase>
        {tally.map(({ emoji, users }) => (
          <ButtonBase key={emoji} onClick={() => onReact(emoji)} aria-pressed={emoji === mine} aria-label={`React with ${emoji}, ${users.length}`} sx={chipStyle(emoji === mine)}>
            <span aria-hidden style={{ fontSize: 18 }}>
              {emoji}
            </span>
            {users.length}
          </ButtonBase>
        ))}
      </Stack>
      <List aria-label="Who reacted" sx={{ overflowY: "auto", pt: 0, pb: 1 }}>
        {rows.map((reaction) => {
          const isMine = reaction.user === meId;
          const person = memberOf(conversation, reaction.user);
          const photo = reaction.message && !reaction.isForAlbum && filesOf(reaction.message)[0];
          const details = (
            <>
              <ListItemAvatar sx={{ minWidth: 52 }}>{getAvatar(person?.avatar, person?.firstName, 40)}</ListItemAvatar>
              <ListItemText
                primary={isMine ? "You" : fullNameOf(person)}
                secondary={isMine && (canHover ? "Click to remove" : "Tap to remove")}
                primaryTypographyProps={{ noWrap: true, fontSize: 15, fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: 13 }}
              />
              {photo && (
                <Box sx={{ width: 30, height: 30, ml: 1, flexShrink: 0, borderRadius: 1, overflow: "hidden" }}>
                  <MediaTile file={photo} isSmall />
                </Box>
              )}
              <Box component="span" aria-hidden sx={{ ml: 1.5, fontSize: 22, lineHeight: 1 }}>
                {reaction.emoji}
              </Box>
            </>
          );
          return isMine ? (
            <ListItemButton key={keyOfReaction(reaction)} onClick={() => remove(reaction)} aria-label={`Remove your ${reaction.emoji} reaction`} sx={{ px: 2.5 }}>
              {details}
            </ListItemButton>
          ) : (
            <ListItem key={keyOfReaction(reaction)} aria-label={`${fullNameOf(person)} reacted ${reaction.emoji}`} sx={{ px: 2.5 }}>
              {details}
            </ListItem>
          );
        })}
      </List>
      <ReactionPicker anchorEl={pickerAnchor} current={mine} onPick={onReact} onClose={() => setPickerAnchor(null)} />
    </>
  );

  const paper = { role: "dialog", "aria-label": "Reactions" };
  return isPhone ? (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      PaperProps={{ ...paper, sx: { maxHeight: "70dvh", pb: "env(safe-area-inset-bottom)", borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundImage: "none" } }}
    >
      {content}
    </Drawer>
  ) : (
    <Popover
      open={isOpen}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: side }}
      transformOrigin={{ vertical: "top", horizontal: side }}
      slotProps={{ paper: { ...paper, sx: { mt: 0.75, width: 340, maxHeight: 420, display: "flex", flexDirection: "column" } } }}
    >
      {content}
    </Popover>
  );
};

export default ReactionList;
