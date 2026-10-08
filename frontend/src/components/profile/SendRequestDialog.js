import { Dialog, DialogContent, DialogTitle } from "@mui/material";

import RequestComposer from "@/components/profile/RequestComposer";

// mounted inside cards and message bubbles, so its taps and keys must not reach their clicks, long press or shortcuts
const keepInside = (event) => event.stopPropagation();

const SendRequestDialog = ({ person, onClose }) => (
  <Dialog
    open
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    aria-labelledby="send-request-title"
    onClick={keepInside}
    onKeyDown={keepInside}
    onContextMenu={keepInside}
    onTouchStart={keepInside}
    onTouchMove={keepInside}
    onTouchEnd={keepInside}
  >
    <DialogTitle id="send-request-title">Add {person.firstName} as a friend</DialogTitle>
    <DialogContent sx={{ pt: "8px !important" }}>
      <RequestComposer person={person} onSent={onClose} onCancel={onClose} />
    </DialogContent>
  </Dialog>
);

export default SendRequestDialog;
