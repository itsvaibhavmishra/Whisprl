import { alpha } from "@mui/material";

export default function Drawer(theme) {
  const isLight = theme.palette.mode === "light";

  return {
    MuiDrawer: {
      styleOverrides: {
        modal: {
          "&.MuiDrawer-anchorRight > .MuiDrawer-paper": {
            boxShadow: `-8px 24px 24px 12px ${alpha(theme.palette.grey[900], isLight ? 0.16 : 0.48)}`,
          },
        },
      },
    },
  };
}
