import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

const ReleaseHighlights = ({ highlights, isWide = false }) => (
  <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 1.5, gridTemplateColumns: isWide ? { sm: "repeat(2, minmax(0, 1fr))" } : "1fr" }}>
    {highlights.map(({ emoji, title, text }) => (
      <Box
        key={title}
        component="li"
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.75,
          p: 2,
          borderRadius: 3,
          border: 1,
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.14),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
        }}
      >
        <Box
          aria-hidden
          sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 22, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14) }}
        >
          {emoji}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" sx={{ mt: 0.25, color: "text.secondary" }}>
            {text}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

export default ReleaseHighlights;
