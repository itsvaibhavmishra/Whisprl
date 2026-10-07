import { Box, Typography } from "@mui/material";

import useSettings from "@/hooks/useSettings";
import WallpaperChoices from "@/sections/chat/wallpaper/WallpaperChoices";
import { SettingsSection } from "@/sections/settings/SettingsSection";

const WallpaperSetting = () => {
  const { wallpapers, onSetWallpaper } = useSettings();
  return (
    <SettingsSection title="Chat wallpaper">
      <Box sx={{ py: 2.5 }}>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary", fontWeight: 400 }}>
          Every chat uses this wallpaper, unless you pick another one in its details. Aurora follows your accent colour.
        </Typography>
        <WallpaperChoices chosenId={wallpapers.all} onChoose={(wallpaper) => onSetWallpaper(wallpaper)} />
      </Box>
    </SettingsSection>
  );
};

export default WallpaperSetting;
