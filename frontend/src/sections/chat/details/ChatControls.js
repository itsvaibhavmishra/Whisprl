import { useState } from "react";
import { List, Menu, MenuItem } from "@mui/material";
import { Archive, Eraser, Flag, Timer, Trash } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { ClearChat, DeleteChat, ReportChat, SetDisappearing, UpdateChatPreferences } from "@/redux/slices/actions/chatSettingsActions";
import ConfirmDialog from "@/components/ConfirmDialog";
import ControlRow from "@/components/ControlRow";
import SafetyRows from "@/components/profile/SafetyRows";
import ReportDialog from "@/components/ReportDialog";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import { identityOf } from "@/utils/chats";
import { DAY_SECONDS, canManage, durationOf } from "@/utils/groups";

const DISAPPEAR_CHOICES = [null, DAY_SECONDS, 7 * DAY_SECONDS, 90 * DAY_SECONDS];

const disappearLabelOf = (seconds) => (seconds ? durationOf(seconds) : "Off");

const ChatControls = ({ conversation }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const [disappearAnchor, setDisappearAnchor] = useState(null);
  const [dialog, setDialog] = useState(null);

  const conversationId = conversation._id;
  const { peer } = identityOf(conversation, meId);
  const person = !conversation.isGroup && peer?._id !== meId ? peer : null;
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
          {person && <SafetyRows person={person} conversationId={conversationId} />}
          {conversation.isGroup && <ControlRow icon={Flag} label="Report group" isDanger onClick={() => setDialog("report")} />}
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
        <ConfirmDialog
          title="Clear this chat?"
          text="Its messages are removed for you only. Everyone else in the chat still has them."
          action="Clear chat"
          onConfirm={() => dispatch(ClearChat(conversationId))}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
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
      {dialog === "report" && (
        <ReportDialog
          subject={conversation.name}
          explanation="Messages stay end-to-end encrypted, so the report holds only what you tell us here."
          report={ReportChat}
          details={{ conversationId }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
};

export default ChatControls;
