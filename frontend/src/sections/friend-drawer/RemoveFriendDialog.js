import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import { XCircle } from "phosphor-react";

const RemoveFriendDialog = ({ open, onClose, onConfirm, userData }) => {
  const [confirmDisabled, setConfirmDisabled] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (open) setConfirmDisabled(true);
    setCountdown(5);
  }, [open]);

  useEffect(() => {
    let timer;
    if (open && countdown > 0 && confirmDisabled) {
      timer = setTimeout(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000); // 1000 milliseconds = 1 second
    } else if (countdown === 0 && confirmDisabled) {
      setConfirmDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, confirmDisabled, open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction={"row"} alignItems="center">
          <Typography variant="h4" component="div" flexGrow={1}>
            Remove Friend
          </Typography>
          <IconButton aria-label="close" onClick={onClose}>
            <XCircle size={26} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack p={2} spacing={2} alignItems={"center"}>
          <Typography
            variant="h6"
            color={"error"}
            sx={{
              display: { xs: "block", md: "flex" },
              textAlign: "center",
              textWrap: "nowrap",
            }}
          >
            You are going to remove&nbsp;
            <Typography
              variant="inherit"
              color={"primary"}
              sx={{ textDecoration: "underline" }}
            >
              {userData?.firstName} {userData?.lastName}
            </Typography>
            &nbsp; from your friends list
          </Typography>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            You will no longer be able to send/receive messages but your
            conversation will remain unchanged
          </Typography>
        </Stack>
      </DialogContent>
      <Typography
        variant="caption"
        color={"primary"}
        sx={{ textAlign: "center" }}
      >
        If you wish to continue please press&nbsp;
        <Typography variant="body2" color="error">
          "Confirm"
        </Typography>
        &nbsp;after timer ends
      </Typography>
      <DialogActions>
        <LoadingButton variant="text" onClick={onClose}>
          Cancel
        </LoadingButton>
        <LoadingButton
          variant="contained"
          color={"error"}
          onClick={() => onConfirm("removeFriend")}
          disabled={confirmDisabled}
        >
          {confirmDisabled ? countdown : "Confirm"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveFriendDialog;
