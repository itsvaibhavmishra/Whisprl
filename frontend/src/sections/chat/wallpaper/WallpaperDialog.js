import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";

import useSettings from "@/hooks/useSettings";
import WallpaperChoices from "@/sections/chat/wallpaper/WallpaperChoices";

const WallpaperDialog = ({ conversationId, name, onClose }) => {
  const { wallpapers, onSetWallpaper } = useSettings();

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="wallpaper-title">
      <DialogTitle id="wallpaper-title">Wallpaper for {name}</DialogTitle>
      <DialogContent>
        <WallpaperChoices
          chosenId={wallpapers.chats[conversationId] ?? null}
          offersDefault
          onChoose={(wallpaper) => onSetWallpaper(wallpaper, conversationId)}
          action={
            <Button variant="contained" onClick={onClose}>
              Done
            </Button>
          }
        />
      </DialogContent>
    </Dialog>
  );
};

export default WallpaperDialog;
