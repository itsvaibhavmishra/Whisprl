import { useState } from "react";
import { Flag, Prohibit, UserMinus } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import ControlRow from "@/components/ControlRow";
import ReportDialog from "@/components/ReportDialog";
import { BlockUser, ReportChat, UnblockUser } from "@/redux/slices/actions/chatSettingsActions";
import { RemoveFriend } from "@/redux/slices/actions/contactActions";

const NONE = [];

// a report from a chat carries the chat with it, while one from a profile is about the person alone
const SafetyRows = ({ person, conversationId, canRemoveFriend = false }) => {
  const dispatch = useDispatch();
  const blocked = useSelector((state) => state.user.user.blocked ?? NONE);
  const [dialog, setDialog] = useState(null);
  const hasBlocked = blocked.includes(person._id);
  const { firstName } = person;
  const close = () => setDialog(null);

  return (
    <>
      {canRemoveFriend && <ControlRow icon={UserMinus} label="Remove friend" isDanger onClick={() => setDialog("remove")} />}
      <ControlRow
        icon={Prohibit}
        label={hasBlocked ? `Unblock ${firstName}` : `Block ${firstName}`}
        isDanger={!hasBlocked}
        onClick={() => (hasBlocked ? dispatch(UnblockUser(person._id)) : setDialog("block"))}
      />
      <ControlRow icon={Flag} label={`Report ${firstName}`} isDanger onClick={() => setDialog("report")} />

      {dialog === "remove" && (
        <ConfirmDialog
          title={`Remove ${firstName} from your friends?`}
          text="Your chat stays, but neither of you can send messages in it until you're friends again."
          action="Remove"
          onConfirm={() => dispatch(RemoveFriend(person._id))}
          onClose={close}
        />
      )}
      {dialog === "block" && (
        <ConfirmDialog
          title={`Block ${firstName}?`}
          text="They won't be able to message you or see when you're online, and they won't be told."
          action="Block"
          onConfirm={() => dispatch(BlockUser(person))}
          onClose={close}
        />
      )}
      {dialog === "report" && (
        <ReportDialog
          subject={firstName}
          explanation="Messages stay end-to-end encrypted, so the report holds only what you tell us here."
          report={ReportChat}
          details={{ conversationId, userId: person._id }}
          person={person}
          onClose={close}
        />
      )}
    </>
  );
};

export default SafetyRows;
