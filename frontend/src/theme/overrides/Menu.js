export default function Menu(theme) {
  return {
    MuiMenu: {
      styleOverrides: {
        list: {
          padding: theme.spacing(0.75),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 8,
          minHeight: 40,
          gap: theme.spacing(1.25),
          '& .MuiListItemIcon-root': {
            minWidth: 'auto',
            color: 'inherit',
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.action.selected,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        },
      },
    },
  };
}
