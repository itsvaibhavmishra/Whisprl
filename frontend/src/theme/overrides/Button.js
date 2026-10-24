export default function Button(theme) {
  return {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "&:hover": {
            boxShadow: "none",
          },
          variants: [
            { props: { variant: "contained", color: "primary" }, style: { boxShadow: theme.customShadows.primary } },
            { props: { variant: "contained", color: "error" }, style: { boxShadow: theme.customShadows.error } },
            {
              props: { variant: "outlined", color: "inherit" },
              style: { border: `1px solid ${theme.palette.grey[500_32]}`, "&:hover": { backgroundColor: theme.palette.action.hover } },
            },
            { props: { variant: "text", color: "inherit" }, style: { "&:hover": { backgroundColor: theme.palette.action.hover } } },
          ],
        },
        sizeLarge: {
          height: 48,
        },
      },
    },
  };
}
