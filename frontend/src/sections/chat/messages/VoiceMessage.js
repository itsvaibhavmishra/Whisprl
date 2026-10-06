import { useEffect, useRef, useState } from "react";
import { ButtonBase, CircularProgress, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Pause, Play } from "phosphor-react";

import TransferRing, { useTransfer } from "@/sections/chat/messages/TransferRing";
import Waveform from "@/sections/chat/messages/Waveform";
import { attachmentUrl, openedFileUrl } from "@/utils/attachments";
import { formatDuration } from "@/utils/video";

const SPEEDS = [1, 1.5, 2];
const CONTROL_SIZE = 38;

// one voice message plays at a time, so starting another pauses this one
let playing = null;

const VoiceMessage = ({ file, isMine }) => {
  const theme = useTheme();
  const audio = useRef(null);
  const frame = useRef(null);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(SPEEDS[0]);
  const transfer = useTransfer([file]);
  const duration = file.duration ?? 0;
  const ownUrl = file.localId ? attachmentUrl(file.localId) : null;
  const isWaiting = !ownUrl && !file.sealed;

  useEffect(
    () => () => {
      if (playing === audio.current) playing = null;
      audio.current?.pause();
      cancelAnimationFrame(frame.current);
    },
    []
  );

  const follow = () => {
    setProgress(duration ? Math.min(audio.current.currentTime / duration, 1) : 0);
    frame.current = requestAnimationFrame(follow);
  };

  const playerOf = () => {
    if (audio.current) return audio.current;
    const player = new Audio();
    player.onplay = () => {
      setStatus("playing");
      frame.current = requestAnimationFrame(follow);
    };
    player.onpause = () => {
      setStatus("paused");
      cancelAnimationFrame(frame.current);
    };
    player.onended = () => {
      setStatus("idle");
      setProgress(0);
    };
    audio.current = player;
    return player;
  };

  // downloaded and decrypted on the first play, so nobody spends data on one they never hear
  const play = async (fromFraction) => {
    const player = playerOf();
    if (playing && playing !== player) playing.pause();
    playing = player;
    try {
      if (!player.src) setStatus("opening");
      const url = ownUrl ?? (await openedFileUrl(file.sealed));
      // another voice message was started, or the chat was left, while this one downloaded
      if (playing !== player) return setStatus("idle");
      if (player.src !== url) player.src = url;
      player.playbackRate = speed;
      if (fromFraction !== undefined) player.currentTime = fromFraction * duration;
      await player.play();
    } catch (error) {
      // starting another voice message straight away interrupts this one's start, which is not a failure
      if (error.name !== "AbortError") setStatus("failed");
    }
  };

  const toggle = () => (status === "playing" ? audio.current.pause() : play());

  const seek = (fraction) => {
    setProgress(fraction);
    if (status === "playing" || status === "paused") audio.current.currentTime = fraction * duration;
    else play(fraction);
  };

  const nextSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audio.current) audio.current.playbackRate = next;
  };

  const ink = isMine ? "#fff" : theme.palette.primary.main;
  const isStarted = status === "playing" || status === "paused";
  const footnote = () => {
    if (file.isLost) return "Not sent";
    if (status === "failed") return "Could not play this";
    return formatDuration(isStarted ? progress * duration : duration);
  };

  const control = () => {
    if (transfer) return <TransferRing transfer={transfer} size={CONTROL_SIZE} />;
    if (status === "opening" || isWaiting) {
      return <CircularProgress size={CONTROL_SIZE - 10} aria-label="Loading voice message" sx={{ color: ink, m: "5px" }} />;
    }
    return (
      <IconButton
        aria-label={status === "playing" ? "Pause voice message" : `Play voice message, ${formatDuration(duration)}`}
        onClick={toggle}
        disabled={file.isLost}
        sx={{ width: CONTROL_SIZE, height: CONTROL_SIZE, color: ink, bgcolor: alpha(ink, isMine ? 0.2 : 0.12) }}
      >
        {status === "playing" ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
      </IconButton>
    );
  };

  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ width: { xs: 220, md: 250 }, maxWidth: "100%", p: 0.5 }}>
      {control()}
      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
        <Waveform
          bars={file.waveform ?? []}
          progress={progress}
          playedColor={ink}
          restColor={isMine ? alpha("#fff", 0.45) : theme.palette.text.disabled}
          onSeek={transfer || file.isLost || isWaiting ? undefined : seek}
          valueText={`${formatDuration(progress * duration)} of ${formatDuration(duration)}`}
        />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ opacity: 0.8, fontVariantNumeric: "tabular-nums" }}>
            {footnote()}
          </Typography>
          <ButtonBase
            aria-label={`Playback speed ${speed}x`}
            onClick={nextSpeed}
            sx={{ px: 0.75, borderRadius: 2, fontSize: 11, fontWeight: 700, lineHeight: "18px", color: ink, bgcolor: alpha(ink, isMine ? 0.2 : 0.12) }}
          >
            {speed}x
          </ButtonBase>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default VoiceMessage;
