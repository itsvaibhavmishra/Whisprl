import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Popover, Slider, Stack, Typography } from "@mui/material";
import { MusicNotes, SpeakerHigh } from "phosphor-react";

import { UpdateGameAudio } from "@/redux/slices/actions/userActions";
import { applyGameLevels, gameAudioOf, playGameSound } from "@/sections/chat/game/gameSounds";

const Level = ({ icon, label, value, onChange, onSave }) => (
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
        onChangeCommitted={(_, next) => onSave(next)}
        aria-label={label}
        valueLabelDisplay="off"
      />
    </Stack>
  </Stack>
);

// music and effects are different kinds of noise, so one switch for both is never the setting someone wants
const SoundMenu = ({ anchor, gameId, track, onClose }) => {
  const dispatch = useDispatch();
  const saved = useSelector((state) => gameAudioOf(state.user.user, gameId));
  const [levels, setLevels] = useState(saved);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (preview === null) return undefined;
    const timer = setTimeout(() => playGameSound("tick"), 120);
    return () => clearTimeout(timer);
  }, [preview]);

  const change = (next) => {
    setLevels(next);
    applyGameLevels(next);
  };

  const save = (next) => dispatch(UpdateGameAudio({ gameId, ...next }));

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
          value={levels.effects}
          onChange={(effects) => {
            change({ ...levels, effects });
            setPreview(effects);
          }}
          onSave={(effects) => save({ ...levels, effects })}
        />
        {track && (
          <Level
            icon={<MusicNotes size={18} weight="bold" />}
            label="Music"
            value={levels.music}
            onChange={(music) => change({ ...levels, music })}
            onSave={(music) => save({ ...levels, music })}
          />
        )}
      </Stack>
    </Popover>
  );
};

export default SoundMenu;
