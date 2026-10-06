import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { Archive, BellSlash, Eraser, Flag, Prohibit, Star, Timer } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import {
  BlockUser,
  ClearChat,
  SetDisappearing,
  UnblockUser,
  UpdateChatPreferences,
} from "@/redux/slices/actions/chatSettingsActions";
import ReportDialog from "@/sections/chat/details/ReportDialog";
import { identityOf, isMuted } from "@/utils/chats";
import { DAY_SECONDS, canManage, durationOf } from "@/utils/groups";

const MUTE_CHOICES = [
  { value: "8h", label: "For 8 hours" },
  { value: "1w", label: "For 1 week" },
  { value: "always", label: "Always" },
];
const DISAPPEAR_CHOICES = [null, DAY_SECONDS, 7 * DAY_SECONDS, 90 * DAY_SECONDS];

const muteLabelOf = (conversation) => {
  if (!isMuted(conversation)) return "Off";
  const until = new Date(conversation.mutedUntil);
  if (until.getFullYear() > 9000) return "Always";
  return `Until ${until.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}`;
};

const disappearLabelOf = (seconds) => (seconds ? durationOf(seconds) : "Off");

const ControlRow = ({ icon: Icon, label, detail, isDanger, ...button }) => (
  <ListItemButton {...button} sx={isDanger ? { color: "error.main" } : undefined}>
    <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
      <Icon size={20} />
    </ListItemIcon>
    <ListItemText primary={label} secondary={detail} />
  </ListItemButton>
);

const Confirm = ({ title, text, action, onConfirm, onClose }) => (
  <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="confirm-title">
    <DialogTitle id="confirm-title">{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{text}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button color="inherit" onClick={onClose}>
        Cancel
      </Button>
      <Button
        color="error"
        variant="contained"
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {action}
      </Button>
    </DialogActions>
  </Dialog>
);

const ChatControls = ({ conversation }) => {
  const dispatch = useDispatch();
  const { _id: meId, blocked = [] } = useSelector((state) => state.user.user);
  const [menu, setMenu] = useState(null);
  const [dialog, setDialog] = useState(null);

  const conversationId = conversation._id;
  const { peer } = identityOf(conversation, meId);
  const person = !conversation.isGroup && peer?._id !== meId ? peer : null;
  const hasBlocked = Boolean(person && blocked.includes(person._id));
  const canSetDisappearing = !conversation.isGroup || canManage(conversation, meId);
  const closeMenu = () => setMenu(null);
  const choose = (run) => () => {
    run();
    closeMenu();
  };
  const update = (changes) => dispatch(UpdateChatPreferences({ conversationId, ...changes }));

  return (
    <>
      <Divider />
      <List aria-label="Chat settings">
        <ControlRow
          icon={BellSlash}
          label="Mute notifications"
          detail={muteLabelOf(conversation)}
          onClick={(event) => setMenu({ kind: "mute", anchor: event.currentTarget })}
        />
        <ControlRow
          icon={Star}
          label={conversation.isFavourite ? "Remove from favourites" : "Add to favourites"}
          onClick={() => update({ isFavourite: !conversation.isFavourite })}
        />
        <ControlRow
          icon={Timer}
          label="Disappearing messages"
          detail={canSetDisappearing ? disappearLabelOf(conversation.disappearAfter) : `${disappearLabelOf(conversation.disappearAfter)}. Only admins can change this`}
          disabled={!canSetDisappearing}
          onClick={(event) => setMenu({ kind: "disappear", anchor: event.currentTarget })}
        />
        <ControlRow
          icon={Archive}
          label={conversation.isArchived ? "Unarchive chat" : "Archive chat"}
          onClick={() => update({ isArchived: !conversation.isArchived })}
        />
        <ControlRow icon={Eraser} label="Clear chat" isDanger onClick={() => setDialog("clear")} />
        {person && (
          <ControlRow
            icon={Prohibit}
            label={hasBlocked ? `Unblock ${person.firstName}` : `Block ${person.firstName}`}
            isDanger={!hasBlocked}
            onClick={() => (hasBlocked ? dispatch(UnblockUser(person._id)) : setDialog("block"))}
          />
        )}
        {(person || conversation.isGroup) && (
          <ControlRow
            icon={Flag}
            label={person ? `Report ${person.firstName}` : "Report group"}
            isDanger
            onClick={() => setDialog("report")}
          />
        )}
      </List>

      <Menu anchorEl={menu?.anchor} open={menu?.kind === "mute"} onClose={closeMenu}>
        {MUTE_CHOICES.map(({ value, label }) => (
          <MenuItem key={value} onClick={choose(() => update({ mute: value }))}>
            {label}
          </MenuItem>
        ))}
        {isMuted(conversation) && <MenuItem onClick={choose(() => update({ mute: "off" }))}>Unmute</MenuItem>}
      </Menu>

      <Menu anchorEl={menu?.anchor} open={menu?.kind === "disappear"} onClose={closeMenu}>
        {DISAPPEAR_CHOICES.map((seconds) => (
          <MenuItem
            key={disappearLabelOf(seconds)}
            selected={(conversation.disappearAfter ?? null) === seconds}
            onClick={choose(() => dispatch(SetDisappearing({ conversationId, seconds })))}
          >
            {disappearLabelOf(seconds)}
          </MenuItem>
        ))}
      </Menu>

      {dialog === "clear" && (
        <Confirm
          title="Clear this chat?"
          text="Its messages are removed for you only. Everyone else in the chat still has them."
          action="Clear chat"
          onConfirm={() => dispatch(ClearChat(conversationId))}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "block" && (
        <Confirm
          title={`Block ${person.firstName}?`}
          text="They won't be able to message you or see when you're online, and they won't be told."
          action="Block"
          onConfirm={() => dispatch(BlockUser(person))}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "report" && <ReportDialog conversation={conversation} person={person} onClose={() => setDialog(null)} />}
    </>
  );
};

export default ChatControls;
