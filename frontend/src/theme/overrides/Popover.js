export default function Popover(theme) {
  return {
    MuiPopover: {
      // Popover sets its own scroll lock, so the MuiModal default in CssBaseline does not reach it.
      defaultProps: { disableScrollLock: true },
      styleOverrides: {
        paper: {
          boxShadow: theme.customShadows.dropdown,
          borderRadius: Number(theme.shape.borderRadius) * 1.5,
        },
      },
    },
  };
}
