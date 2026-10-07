import { Typography } from "@mui/material";

// nearly opaque rather than blurred, so notes stay readable over any wallpaper without a blur repainting as messages scroll
const ChatNote = ({ children, sx, ...props }) => (
  <Typography
    component="p"
    {...props}
    sx={{
      alignSelf: "center",
      maxWidth: "85%",
      my: 0.75,
      px: 1.5,
      py: 0.5,
      borderRadius: 99,
      textAlign: "center",
      fontSize: 12,
      fontWeight: 600,
      color: "text.secondary",
      bgcolor: "chat.pill",
      ...sx,
    }}
  >
    {children}
  </Typography>
);

export default ChatNote;
