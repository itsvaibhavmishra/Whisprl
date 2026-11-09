import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

// fixed colours rather than the chosen accent, so an Official badge looks the same to everyone
const BADGES = {
  owner: { label: "Owner", hue: "#FFC107", day: "#7A4F01", night: "#FFE16A" },
  admin: { label: "Admin", hue: "#7444E0", day: "#5229B8", night: "#C9B6FA" },
  official: { label: "Official", hue: "#0979C2", day: "#075C94", night: "#8ADDF8" },
};

const PersonBadge = ({ badge }) => {
  const look = BADGES[badge];
  if (!look) return null;

  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        height: 18,
        px: 0.75,
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "0.01em",
        color: theme.palette.mode === "dark" ? look.night : look.day,
        bgcolor: alpha(look.hue, theme.palette.mode === "dark" ? 0.18 : 0.16),
      })}
    >
      {look.label}
    </Box>
  );
};

export default PersonBadge;
