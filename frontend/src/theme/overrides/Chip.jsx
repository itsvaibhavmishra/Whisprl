export default function Chip(theme) {
  return {
    MuiChip: {
      styleOverrides: {
        outlined: {
          borderColor: theme.palette.grey[500_32],
          "&.MuiChip-colorPrimary": {
            borderColor: theme.palette.primary.main,
          },
        },
      },
    },
  };
}
