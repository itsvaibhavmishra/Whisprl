import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Archive, Eraser, Flag, Prohibit, Timer, Trash } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import {
  BlockUser,
  ClearChat,
  DeleteChat,
  SetDisappearing,
  UnblockUser,
  UpdateChatPreferences,
} from "@/redux/slices/actions/chatSettingsActions";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import ReportDialog from "@/sections/chat/details/ReportDialog";
import { identityOf } from "@/utils/chats";
import { DAY_SECONDS, canManage, durationOf } from "@/utils/groups";

const DISAPPEAR_CHOICES = [null, DAY_SECONDS, 7 * DAY_SECONDS, 90 * DAY_SECONDS];

const disappearLabelOf = (seconds) => (seconds ? durationOf(seconds) : "Off");

export const ControlRow = ({ icon: Icon, label, detail, isDanger, ...button }) => (
  <ListItemButton {...button} sx={{ gap: 1.5, px: 1, borderRadius: 3, color: isDanger ? "error.main" : "text.primary" }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: 2.5,
        display: "grid",
        placeItems: "center",
        color: isDanger ? "error.main" : "primary.main",
        bgcolor: (theme) => alpha(isDanger ? theme.palette.error.main : theme.palette.primary.main, 0.1),
      }}
    >
      <Icon size={19} weight="bold" />
    </Box>
    <ListItemText primary={label} secondary={detail} primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }} secondaryTypographyProps={{ fontSize: 12.5 }} />
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
  const [disappearAnchor, setDisappearAnchor] = useState(null);
  const [dialog, setDialog] = useState(null);

  const conversationId = conversation._id;
  const { peer } = identityOf(conversation, meId);
  const person = !conversation.isGroup && peer?._id !== meId ? peer : null;
  const hasBlocked = Boolean(person && blocked.includes(person._id));
  const canSetDisappearing = !conversation.isGroup || canManage(conversation, meId);

  const chooseDisappearing = (seconds) => {
    setDisappearAnchor(null);
    dispatch(SetDisappearing({ conversationId, seconds }));
  };

  return (
    <>
      <DetailsSection title="Chat settings">
        <List aria-label="Chat settings" disablePadding sx={{ pb: 3 }}>
          <ControlRow
            icon={Timer}
            label="Disappearing messages"
            detail={canSetDisappearing ? disappearLabelOf(conversation.disappearAfter) : `${disappearLabelOf(conversation.disappearAfter)}. Only admins can change this`}
            disabled={!canSetDisappearing}
            onClick={(event) => setDisappearAnchor(event.currentTarget)}
          />
          <ControlRow
            icon={Archive}
            label={conversation.isArchived ? "Unarchive chat" : "Archive chat"}
            onClick={() => dispatch(UpdateChatPreferences({ conversationId, isArchived: !conversation.isArchived }))}
          />
          <ControlRow icon={Eraser} label="Clear chat" isDanger onClick={() => setDialog("clear")} />
          {!conversation.isGroup && <ControlRow icon={Trash} label="Delete chat" isDanger onClick={() => setDialog("delete")} />}
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
      </DetailsSection>

      <Menu anchorEl={disappearAnchor} open={Boolean(disappearAnchor)} onClose={() => setDisappearAnchor(null)}>
        {DISAPPEAR_CHOICES.map((seconds) => (
          <MenuItem
            key={disappearLabelOf(seconds)}
            selected={(conversation.disappearAfter ?? null) === seconds}
            onClick={() => chooseDisappearing(seconds)}
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
      {dialog === "delete" && (
        <Confirm
          title="Delete this chat?"
          text={
            person
              ? `It leaves your chats and its messages are cleared for you. ${person.firstName} keeps the chat, and a new message brings it back.`
              : "It leaves your chats and its notes are cleared."
          }
          action="Delete chat"
          onConfirm={() => dispatch(DeleteChat(conversationId))}
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
