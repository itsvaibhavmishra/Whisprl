import { Box, Typography } from "@mui/material";

const Notice = ({ title, children }) => (
  <Box sx={{ mt: 4, maxWidth: 460 }}>
    <Typography component="h2" sx={{ m: 0, fontSize: 17, fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography sx={{ mt: 0.75, fontSize: 14.5, color: "text.secondary" }}>{children}</Typography>
  </Box>
);

export default Notice;
