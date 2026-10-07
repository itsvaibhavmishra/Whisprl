import { useState } from "react";
import { IconButton, Stack, Tooltip } from "@mui/material";
import { ArrowBendUpLeft, ArrowBendUpRight, DownloadSimple, Smiley, Trash } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { ReactToMessage } from "@/redux/slices/actions/messageActions";
import { setReplyingTo } from "@/redux/slices/chatSlice";
import DeleteMessageDialog from "@/sections/chat/messages/DeleteMessageDialog";
import ForwardDialog from "@/sections/chat/messages/ForwardDialog";
import ReactionPicker from "@/sections/chat/messages/ReactionPicker";
import { VIEWER_BUTTON } from "@/sections/chat/viewer/viewerTheme";
import { downloadFile, openedFileUrl, ownUrlOf } from "@/utils/attachments";
import { notify } from "@/utils/notify";
import { myReactionOn } from "@/utils/reactions";

const CAPSULE_BUTTON = { ...VIEWER_BUTTON, bgcolor: "transparent", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" } };

const ViewerButton = ({ label, children, ...button }) => (
  <Tooltip title={label}>
    <span>
      <IconButton aria-label={label} sx={CAPSULE_BUTTON} {...button}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const ViewerActions = ({ item, onClose }) => {
  const { file, message } = item;
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [dialog, setDialog] = useState(null);

  if (message.outboxEntry) return null;

  // the reply starts once the viewer has gone, or closing it would hand focus back to the photo instead of the message box
  const reply = () => onClose().then(() => dispatch(setReplyingTo(message)));

  // fetched only when asked for, so a video nobody played is not downloaded just by being open here
  const save = async () => {
    try {
      const url = ownUrlOf(file) ?? (await openedFileUrl(file.sealed));
      await downloadFile(url, file.fileName);
    } catch {
      notify({ severity: "error", message: "Could not save this file" });
    }
  };

  return (
    <Stack
      role="toolbar"
      aria-label="Photo actions"
      direction="row"
      alignItems="center"
      spacing={0.25}
      sx={{ p: 0.5, borderRadius: 99, bgcolor: "rgba(255, 255, 255, 0.07)", boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)" }}
    >
      <ViewerButton label="React" onClick={(event) => setPickerAnchor(event.currentTarget)}>
        <Smiley size={22} />
      </ViewerButton>
      <ViewerButton label="Reply" onClick={reply}>
        <ArrowBendUpLeft size={22} />
      </ViewerButton>
      {/* a plain file from before encryption has no sealed copy the server could point a forward at */}
      {message.file && (
        <ViewerButton label="Forward" onClick={() => setDialog("forward")}>
          <ArrowBendUpRight size={22} />
        </ViewerButton>
      )}
      <ViewerButton label="Save" onClick={save} disabled={file.isUploading}>
        <DownloadSimple size={22} />
      </ViewerButton>
      <ViewerButton label="Delete" onClick={() => setDialog("delete")}>
        <Trash size={22} />
      </ViewerButton>

      <ReactionPicker
        anchorEl={pickerAnchor}
        current={myReactionOn(message, meId)}
        onPick={(emoji) => dispatch(ReactToMessage({ message, emoji }))}
        onClose={() => setPickerAnchor(null)}
      />
      {dialog === "forward" && <ForwardDialog messages={[message]} open onClose={() => setDialog(null)} />}
      {dialog === "delete" && (
        <DeleteMessageDialog messages={[message]} canDeleteForEveryone={message.sender?._id === meId} open onClose={() => setDialog(null)} onChosen={onClose} />
      )}
    </Stack>
  );
};

export default ViewerActions;
