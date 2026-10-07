import { forwardRef, useState } from "react";
import { Box, ButtonBase, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BellSimple, BellSlash, Image, Star } from "phosphor-react";
import { useDispatch } from "react-redux";

import useSettings from "@/hooks/useSettings";
import { UpdateChatPreferences } from "@/redux/slices/actions/chatSettingsActions";
import WallpaperDialog from "@/sections/chat/wallpaper/WallpaperDialog";
import { isMuted } from "@/utils/chats";
import { clockOptions } from "@/utils/formatMessageTime";

const MUTE_CHOICES = [
  { value: "8h", label: "For 8 hours" },
  { value: "1w", label: "For 1 week" },
  { value: "always", label: "Always" },
];

const muteLabelOf = (conversation, use24Hour) => {
  if (!isMuted(conversation)) return "Off";
  const until = new Date(conversation.mutedUntil);
  if (until.getFullYear() > 9000) return "Always";
  return `Until ${until.toLocaleString(undefined, { weekday: "short", ...clockOptions(use24Hour) })}`;
};

const Tile = forwardRef(({ icon: Icon, label, isOn, ...button }, ref) => (
  <ButtonBase
    ref={ref}
    {...button}
    sx={{
      flex: 1,
      flexDirection: "column",
      gap: 0.75,
      height: 72,
      borderRadius: 2,
      bgcolor: "chat.field",
      color: isOn ? "primary.main" : "text.primary",
      transition: "background-color 160ms ease, transform 160ms ease",
      "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1) },
      "&:active": { transform: "scale(0.97)" },
    }}
  >
    <Icon size={22} weight={isOn ? "fill" : "regular"} />
    <Typography component="span" sx={{ fontSize: 12, fontWeight: 700 }}>
      {label}
    </Typography>
  </ButtonBase>
));

const QuickActions = ({ conversation, name }) => {
  const dispatch = useDispatch();
  const { use24Hour } = useSettings();
  const [muteAnchor, setMuteAnchor] = useState(null);
  const [isChoosingWallpaper, setIsChoosingWallpaper] = useState(false);
  const isQuiet = isMuted(conversation);
  const muteLabel = muteLabelOf(conversation, use24Hour);
  const isFavourite = Boolean(conversation.isFavourite);
  const update = (changes) => dispatch(UpdateChatPreferences({ conversationId: conversation._id, ...changes }));

  const mute = (value) => {
    setMuteAnchor(null);
    update({ mute: value });
  };

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Stack direction="row" spacing={1}>
        <Tooltip title={isQuiet ? muteLabel : ""}>
          <Tile
            icon={isQuiet ? BellSlash : BellSimple}
            label={isQuiet ? "Muted" : "Mute"}
            isOn={isQuiet}
            aria-label={`Mute notifications, ${muteLabel}`}
            aria-haspopup="menu"
            onClick={(event) => setMuteAnchor(event.currentTarget)}
          />
        </Tooltip>
        <Tile icon={Star} label="Favourite" isOn={isFavourite} aria-pressed={isFavourite} onClick={() => update({ isFavourite: !isFavourite })} />
        <Tile icon={Image} label="Wallpaper" aria-haspopup="dialog" onClick={() => setIsChoosingWallpaper(true)} />
      </Stack>

      <Menu anchorEl={muteAnchor} open={Boolean(muteAnchor)} onClose={() => setMuteAnchor(null)}>
        {MUTE_CHOICES.map(({ value, label }) => (
          <MenuItem key={value} onClick={() => mute(value)}>
            {label}
          </MenuItem>
        ))}
        {isQuiet && <MenuItem onClick={() => mute("off")}>Unmute</MenuItem>}
      </Menu>

      {isChoosingWallpaper && <WallpaperDialog conversationId={conversation._id} name={name} onClose={() => setIsChoosingWallpaper(false)} />}
    </Box>
  );
};

export default QuickActions;
