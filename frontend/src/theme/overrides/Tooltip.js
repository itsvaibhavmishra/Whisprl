export default function Tooltip(theme) {
  const isLight = theme.palette.mode === 'light';
  const background = isLight ? theme.palette.chat.rail : '#26344D';

  return {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: background,
          color: '#E9EEF6',
          fontSize: 12,
          fontWeight: 600,
          padding: theme.spacing(0.75, 1.25),
          borderRadius: 8,
        },
        arrow: {
          color: background,
        },
      },
    },
  };
}
