import { InfoIcon, WarningIcon } from "@/theme/overrides/CustomIcons";

export default function Alert(theme) {
  const isLight = theme.palette.mode === "light";

  const standardStyle = (color) => ({
    color: theme.palette[color][isLight ? "darker" : "lighter"],
    backgroundColor: theme.palette[color][isLight ? "lighter" : "darker"],
    "& .MuiAlert-icon": {
      color: theme.palette[color][isLight ? "main" : "light"],
    },
  });

  return {
    MuiAlert: {
      defaultProps: {
        iconMapping: {
          info: <InfoIcon />,
          warning: <WarningIcon />,
        },
      },

      styleOverrides: {
        root: {
          variants: ["info", "warning"].map((severity) => ({ props: { variant: "standard", severity }, style: standardStyle(severity) })),
        },
      },
    },
  };
}
