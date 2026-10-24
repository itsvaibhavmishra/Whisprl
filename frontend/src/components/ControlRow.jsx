import { Box, ListItemButton, ListItemText } from "@mui/material";
import { alpha } from "@mui/material/styles";

const ControlRow = ({ icon: Icon, label, detail, isDanger, ...button }) => (
  <ListItemButton {...button} sx={{ gap: 1.5, px: 1.5, borderRadius: 3, color: isDanger ? "error.main" : "text.primary" }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: 2.5,
        display: "grid",
        placeItems: "center",
        color: isDanger ? "error.main" : "primary.main",
        bgcolor: (theme) => alpha(isDanger ? theme.palette.error.main : theme.palette.primary.main, 0.1),
      }}
    >
      <Icon size={19} weight="bold" />
    </Box>
    <ListItemText primary={label} secondary={detail} primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }} secondaryTypographyProps={{ fontSize: 12.5 }} />
  </ListItemButton>
);

export default ControlRow;
