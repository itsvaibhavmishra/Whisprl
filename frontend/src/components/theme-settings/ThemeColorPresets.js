import PropTypes from "prop-types";
import { useMemo } from "react";
import { alpha, ThemeProvider, createTheme, useTheme } from "@mui/material/styles";

import useSettings from "@/hooks/useSettings";
import componentsOverride from "@/theme/overrides";
import { primaryFor } from "@/utils/colorPresets";

ThemeColorPresets.propTypes = {
  children: PropTypes.node,
};

export default function ThemeColorPresets({ children }) {
  const defaultTheme = useTheme();
  const { themeColorPresets } = useSettings();

  const theme = useMemo(() => {
    const primary = primaryFor(themeColorPresets, defaultTheme.palette.mode);
    const themed = createTheme({
      ...defaultTheme,
      palette: { ...defaultTheme.palette, primary },
      customShadows: { ...defaultTheme.customShadows, primary: `0 8px 20px -4px ${alpha(primary.main, 0.36)}` },
    });
    themed.components = componentsOverride(themed);
    return themed;
  }, [themeColorPresets, defaultTheme]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
