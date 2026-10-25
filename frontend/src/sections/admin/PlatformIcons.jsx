import { Stack, Tooltip } from "@mui/material";
import { AndroidLogoIcon, GlobeIcon } from "@phosphor-icons/react";

const PLATFORMS = {
  web: { label: "Website", Icon: GlobeIcon },
  android: { label: "Android app", Icon: AndroidLogoIcon },
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
