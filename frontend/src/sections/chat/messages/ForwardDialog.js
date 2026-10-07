import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { ForwardMessage } from "@/redux/slices/actions/messageActions";
import { identityOf } from "@/utils/chats";
import getAvatar from "@/utils/avatars";
import { notify } from "@/utils/notify";

const MAX_TARGETS = 5;

const ForwardDialog = ({ message, open, onClose }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const conversations = useSelector((state) => state.chat.conversations);
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState([]);

  const toggle = (conversationId) =>
    setChosen((ids) => (ids.includes(conversationId) ? ids.filter((id) => id !== conversationId) : [...ids, conversationId]));

  const forward = () => {
    dispatch(ForwardMessage({ message, conversationIds: chosen }));
    notify({ severity: "success", message: chosen.length === 1 ? "Forwarded" : `Forwarded to ${chosen.length} chats` });
    onClose();
  };

  const matching = conversations
    .filter((conversation) => conversation.canMessage !== false)
    .map((conversation) => ({ conversation, ...identityOf(conversation, meId) }))
    .filter(({ name }) => name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="forward-title">
      <DialogTitle id="forward-title">Forward to</DialogTitle>
      <DialogContent>
        <TextField size="small" label="Search chats" value={query} onChange={(event) => setQuery(event.target.value)} fullWidth sx={{ mt: 1 }} />
        <List dense sx={{ maxHeight: 320, overflowY: "auto" }} className="scrollbar">
          {matching.map(({ conversation, name, avatar }) => {
            const isChosen = chosen.includes(conversation._id);
            return (
              <ListItem key={conversation._id} disablePadding>
                <ListItemButton onClick={() => toggle(conversation._id)} disabled={!isChosen && chosen.length >= MAX_TARGETS}>
                  <ListItemAvatar>{getAvatar(avatar, name, 36)}</ListItemAvatar>
                  <ListItemText primary={name} />
                  <Checkbox edge="end" checked={isChosen} tabIndex={-1} disableRipple inputProps={{ "aria-label": `Forward to ${name}` }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={forward} disabled={!chosen.length}>
          {chosen.length > 1 ? `Forward to ${chosen.length}` : "Forward"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForwardDialog;
