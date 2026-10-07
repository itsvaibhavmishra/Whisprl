import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import { CssBaseline, useMediaQuery } from '@mui/material';
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
  StyledEngineProvider,
} from '@mui/material/styles';
import useSettings from '@/hooks/useSettings';
import palette from '@/theme/palette';
import typography from '@/theme/typography';
import breakpoints from '@/theme/breakpoints';
import componentsOverride from '@/theme/overrides';
import shadows, { customShadows } from '@/theme/shadows';

ThemeProvider.propTypes = {
  children: PropTypes.node,
};

export default function ThemeProvider({ children }) {
  const { themeMode, themeDirection } = useSettings();

  const deviceIsDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isLight = themeMode === 'system' ? !deviceIsDark : themeMode === 'light';

  const themeOptions = useMemo(
    () => ({
      palette: isLight ? palette.light : palette.dark,
      typography,
      breakpoints,
      shape: { borderRadius: 8 },
      direction: themeDirection,
      shadows: isLight ? shadows.light : shadows.dark,
      customShadows: isLight ? customShadows.light : customShadows.dark,
    }),
    [isLight, themeDirection]
  );

  const theme = createTheme(themeOptions);
  const barColor = theme.palette.chat.list;

  // the in-app mode can differ from the device's, so both media-keyed tags take the app's top-edge colour
  useEffect(() => {
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', barColor));
  }, [barColor]);

  theme.components = componentsOverride(theme);

  return (
    <StyledEngineProvider injectFirst>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </StyledEngineProvider>
  );
}
