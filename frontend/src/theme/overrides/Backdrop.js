import { alpha } from '@mui/material/styles';

export default function Backdrop(theme) {
  const isDark = theme.palette.mode === 'dark';

  return {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? alpha('#03060C', 0.72) : alpha(theme.palette.chat.rail, 0.42),
          '&.MuiBackdrop-invisible': {
            background: 'transparent',
          },
        },
      },
    },
  };
}
