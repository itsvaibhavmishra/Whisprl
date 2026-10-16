import { Dialog, DialogTitle, List, ListItemAvatar, ListItemButton, ListItemText, Typography } from "@mui/material";
import { useDispatch } from "react-redux";

import { ActInGame } from "@/redux/slices/actions/gameActions";
import getAvatar from "@/utils/avatars";

const SaveSeatDialog = ({ conversation, session, seat, meId, onClose }) => {
  const dispatch = useDispatch();
  const seated = (seat.kind === "room" ? session.roomSeats : session.seats).map((taken) => taken.user);
  const members = conversation.users.filter((member) => member._id !== meId && !seated.includes(member._id));

  const save = (userId) => {
    dispatch(ActInGame({ conversationId: conversation._id, type: "invite", ...seat, userId }));
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Save this seat for</DialogTitle>
      {members.length ? (
        <List sx={{ pt: 0, pb: 1.5, maxHeight: 420, overflowY: "auto" }}>
          {members.map((member) => (
            <ListItemButton key={member._id} onClick={() => save(member._id)} sx={{ px: 3 }}>
              <ListItemAvatar>{getAvatar(member.avatar, member.firstName, 36)}</ListItemAvatar>
              <ListItemText primary={`${member.firstName} ${member.lastName}`} />
            </ListItemButton>
          ))}
        </List>
      ) : (
        <Typography sx={{ px: 3, pb: 3, color: "text.secondary" }}>Everyone here already has a seat.</Typography>
      )}
    </Dialog>
  );
};

export default SaveSeatDialog;
