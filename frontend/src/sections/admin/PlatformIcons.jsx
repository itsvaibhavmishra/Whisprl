import { Stack, Tooltip } from "@mui/material";
import { AndroidLogo, Globe } from "phosphor-react";

const PLATFORMS = {
  web: { label: "Website", Icon: Globe },
  android: { label: "Android app", Icon: AndroidLogo },
};

const PlatformIcons = ({ platforms, size = 18 }) => (
  <Stack direction="row" spacing={0.5} sx={{ color: "text.secondary" }}>
    {Object.entries(PLATFORMS)
      .filter(([platform]) => platforms.includes(platform))
      .map(([platform, { label, Icon }]) => (
        <Tooltip key={platform} title={label}>
          <Icon size={size} weight="duotone" aria-label={label} role="img" />
        </Tooltip>
      ))}
  </Stack>
);

export default PlatformIcons;
