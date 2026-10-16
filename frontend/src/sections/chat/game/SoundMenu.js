import { useEffect, useState } from "react";
import { Popover, Slider, Stack, Typography } from "@mui/material";
import { MusicNotes, SpeakerHigh } from "phosphor-react";

import useLocalStorage from "@/hooks/useLocalStorage";
import { EFFECTS_KEY, MUSIC_KEY, playGameSound, setMusicLevel, startMusic, stopMusic } from "@/sections/chat/game/gameSounds";

const Level = ({ icon, label, value, onChange }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: 210 }}>
    <Stack alignItems="center" sx={{ width: 26, color: "text.secondary" }}>{icon}</Stack>
    <Stack sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{label}</Typography>
      <Slider
        size="small"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(_, next) => onChange(next)}
        aria-label={label}
        valueLabelDisplay="off"
      />
    </Stack>
  </Stack>
);

// music and effects are different kinds of noise, so one switch for both is never the setting someone wants
const SoundMenu = ({ anchor, onClose }) => {
  const [effects, setEffects] = useLocalStorage(EFFECTS_KEY, 1);
  const [music, setMusic] = useLocalStorage(MUSIC_KEY, 0);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (preview === null) return undefined;
    const timer = setTimeout(() => playGameSound("tick"), 120);
    return () => clearTimeout(timer);
  }, [preview]);

  const changeMusic = (level) => {
    setMusic(level);
    if (level > 0) startMusic();
    if (level > 0) setMusicLevel(level);
    else stopMusic();
  };

  return (
    <Popover
      open
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { mt: 1, p: 2, borderRadius: 3 } } }}
    >
      <Stack spacing={1.5}>
        <Level
          icon={<SpeakerHigh size={18} weight="bold" />}
          label="Sound effects"
          value={effects}
          onChange={(level) => {
            setEffects(level);
            setPreview(level);
          }}
        />
        <Level icon={<MusicNotes size={18} weight="bold" />} label="Music" value={music} onChange={changeMusic} />
      </Stack>
    </Popover>
  );
};

export default SoundMenu;
