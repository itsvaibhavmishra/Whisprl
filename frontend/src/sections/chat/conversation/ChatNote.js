import { Typography } from "@mui/material";

// a small solid pill, so notes stay readable over the doodled background
const ChatNote = ({ children, sx, ...props }) => (
  <Typography
    variant="caption"
    component="p"
    {...props}
    sx={{
      alignSelf: "center",
      maxWidth: "85%",
      m: 0,
      my: 0.75,
      px: 1.5,
      py: 0.5,
      borderRadius: 99,
      textAlign: "center",
      color: "text.secondary",
      bgcolor: "background.default",
      ...sx,
    }}
  >
    {children}
  </Typography>
);

export default ChatNote;
