import { useState } from "react";
import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tooltip } from "@mui/material";
import { ArrowBendUpLeft, Copy, DotsThreeVertical, PencilSimple, PushPin, ArrowBendUpRight, Smiley, Trash } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { PinMessage, UnpinMessage } from "@/redux/slices/actions/messageActions";
import { setEditing, setReplyingTo } from "@/redux/slices/chatSlice";
import DeleteMessageDialog from "@/sections/chat/messages/DeleteMessageDialog";
import ForwardDialog from "@/sections/chat/messages/ForwardDialog";
import ReactionPicker from "@/sections/chat/messages/ReactionPicker";
import { notify } from "@/utils/notify";
import { myReactionOn } from "@/utils/reactions";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export const isEditable = (message, meId) =>
  message.sender._id === meId &&
  Boolean(message.message) &&
  !message.file &&
  !message.contact &&
  Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;

const ToolButton = ({ label, onClick, children }) => (
  <Tooltip title={label}>
    <IconButton size="small" aria-label={label} onClick={onClick} sx={{ color: "text.secondary" }}>
      {children}
    </IconButton>
  </Tooltip>
);

// the toolbar shows on hover or focus; a long press opens the same choices as a menu on touch screens
const MessageActions = ({ message, conversation, isMine, menuAnchor, onMenuClose, onReact }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [dialog, setDialog] = useState(null);

  const openMenuAt = menuAnchor ?? moreAnchor;
  const closeMenu = () => {
    setMoreAnchor(null);
    onMenuClose?.();
  };

  const isDeleted = Boolean(message.deletedAt);
  const isPinned = conversation.pins?.some((pin) => pin.message?._id === message._id);
  const canForward = !message.undecryptable && !message.viewOnce && Boolean(message.message || message.file || message.contact);

  const copy = () =>
    navigator.clipboard
      .writeText(message.message)
      .then(() => notify({ severity: "success", message: "Copied" }))
      .catch(() => notify({ severity: "error", message: "Could not copy that message" }));

  const items = isDeleted
    ? [{ label: "Delete for me", icon: Trash, run: () => setDialog("delete"), isDanger: true }]
    : [
        menuAnchor && { label: "React", icon: Smiley, run: () => setPickerAnchor(menuAnchor) },
        { label: "Reply", icon: ArrowBendUpLeft, run: () => dispatch(setReplyingTo(message)) },
        canForward && { label: "Forward", icon: ArrowBendUpRight, run: () => setDialog("forward") },
        message.message && { label: "Copy", icon: Copy, run: copy },
        isEditable(message, meId) && { label: "Edit", icon: PencilSimple, run: () => dispatch(setEditing(message)) },
        { label: isPinned ? "Unpin" : "Pin", icon: PushPin, run: () => dispatch((isPinned ? UnpinMessage : PinMessage)(message)) },
        { label: "Delete", icon: Trash, run: () => setDialog("delete"), isDanger: true },
      ].filter(Boolean);

  return (
    <>
      <Stack
        direction="row"
        className="message-tools"
        sx={{
          position: "absolute",
          top: "50%",
          [isMine ? "right" : "left"]: "calc(100% + 6px)",
          transform: "translateY(-50%)",
          zIndex: 1,
          p: 0.25,
          borderRadius: 99,
          bgcolor: "chat.raised",
          boxShadow: (theme) => `0 4px 14px -4px ${theme.palette.chat.shade}, 0 0 0 1px ${theme.palette.chat.edge}`,
          opacity: 0,
          transition: "opacity 120ms",
          "@media (hover: none)": { display: "none" },
        }}
      >
        {!isDeleted && (
          <>
            <ToolButton label="React" onClick={(event) => setPickerAnchor(event.currentTarget)}>
              <Smiley size={18} />
            </ToolButton>
            <ToolButton label="Reply" onClick={() => dispatch(setReplyingTo(message))}>
              <ArrowBendUpLeft size={18} />
            </ToolButton>
          </>
        )}
        <ToolButton label="More actions" onClick={(event) => setMoreAnchor(event.currentTarget)}>
          <DotsThreeVertical size={18} weight="bold" />
        </ToolButton>
      </Stack>

      <Menu
        anchorEl={openMenuAt}
        open={Boolean(openMenuAt)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: isMine ? "right" : "left" }}
        transformOrigin={{ vertical: "top", horizontal: isMine ? "right" : "left" }}
      >
        {items.flatMap(({ label, icon: Icon, run, isDanger }, index) => [
          isDanger && index > 0 && <Divider key={`${label}-divider`} sx={{ my: "4px !important" }} />,
          <MenuItem
            key={label}
            onClick={() => {
              closeMenu();
              run();
            }}
            sx={isDanger ? { color: "error.main" } : undefined}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <Icon size={18} />
            </ListItemIcon>
            {label}
          </MenuItem>,
        ])}
      </Menu>

      <ReactionPicker
        anchorEl={isDeleted ? null : pickerAnchor}
        current={myReactionOn(message, meId)}
        onPick={onReact}
        onClose={() => setPickerAnchor(null)}
      />
      {dialog === "forward" && !isDeleted && <ForwardDialog message={message} open onClose={() => setDialog(null)} />}
      {dialog === "delete" && (
        <DeleteMessageDialog message={message} canDeleteForEveryone={isMine && !isDeleted} open onClose={() => setDialog(null)} />
      )}
    </>
  );
};

export default MessageActions;
