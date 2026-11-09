import { useMemo } from "react";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";

import { NAVY_CHAT } from "@/theme/palette";

const ChatTheme = ({ children }) => {
  const outer = useTheme();
  const isDark = outer.palette.mode === "dark";
  const theme = useMemo(() => isDark && createTheme(outer, { palette: NAVY_CHAT }), [outer, isDark]);
  return theme ? <ThemeProvider theme={theme}>{children}</ThemeProvider> : children;
};

export default ChatTheme;
