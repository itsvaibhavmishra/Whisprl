import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { ShareContacts } from "@/redux/slices/actions/messageActions";
import FriendPicker from "@/components/FriendPicker";

const ShareContactDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [chosen, setChosen] = useState([]);
  const friends = useSelector((state) => state.user.friends).filter((friend) => chosen.includes(friend._id));

  const share = () => {
    dispatch(ShareContacts(friends));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="share-contact-title">
      <DialogTitle id="share-contact-title">Share a contact</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FriendPicker selected={chosen} onChange={setChosen} requireKeys={false} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={share} disabled={!chosen.length}>
          {chosen.length > 1 ? `Share ${chosen.length} contacts` : "Share"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareContactDialog;
