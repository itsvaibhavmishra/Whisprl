import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useDispatch } from "react-redux";

import { DeleteStatus } from "@/redux/slices/actions/statusActions";

const DeleteUpdateDialog = ({ status, onClose }) => {
  const dispatch = useDispatch();

  const remove = () => {
    dispatch(DeleteStatus(status._id));
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="delete-update-title">
      <DialogTitle id="delete-update-title">Delete this update?</DialogTitle>
      <DialogContent>
        <DialogContentText>It disappears for everyone who can see it, along with its views and reactions.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={remove}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUpdateDialog;
