export default function Avatar(theme) {
  return {
    MuiAvatar: {
      styleOverrides: {
        colorDefault: {
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.grey[400],
        },
      },
    },
    MuiAvatarGroup: {
      // styled through its own slot, since without a "+N" the first avatar in the markup is a real person
      defaultProps: {
        slotProps: {
          surplus: { sx: { fontSize: 14, color: theme.palette.primary.main, backgroundColor: theme.palette.primary.lighter } },
        },
      },
      styleOverrides: {
        avatar: {
          fontSize: 16,
          fontWeight: theme.typography.fontWeightMedium,
        },
      },
    },
  };
}
