import { DialogTitle, IconButton, Typography } from "@mui/material";
import { XIcon } from "@phosphor-icons/react";

const ClosableTitle = ({ title, onClose, sx }) => (
  <DialogTitle component="div" sx={{ pr: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", ...sx }}>
    <Typography component="h2" variant="h6">
      {title}
    </Typography>
    <IconButton aria-label="Close" onClick={onClose}>
      <XIcon size={20} weight="bold" />
    </IconButton>
  </DialogTitle>
);

export default ClosableTitle;
