import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

const ConfirmDialog = ({ title, text, action, onConfirm, onClose }) => (
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

export default ConfirmDialog;
