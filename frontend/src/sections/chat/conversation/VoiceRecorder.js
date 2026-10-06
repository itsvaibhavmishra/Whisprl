import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { CaretLeft, CaretUp, LockSimple, Microphone, PaperPlaneTilt, Trash } from "phosphor-react";
import { useDispatch } from "react-redux";

import { SendVoiceMessage } from "@/redux/slices/actions/attachmentActions";
import Waveform from "@/sections/chat/messages/Waveform";
import { notify } from "@/utils/notify";
import { formatDuration } from "@/utils/video";
import { MAX_VOICE_SECONDS, MIN_VOICE_SECONDS, MicrophoneRefusal, WAVEFORM_BARS, startVoiceRecording } from "@/utils/voice";

const CANCEL_PX = 90;
const LOCK_PX = 70;
// a mouse has nothing to hold, so a click shorter than this records hands-free instead
const QUICK_PRESS_MS = 250;
const HOLD_HINT = "Hold to record, let go to send";
// none while holding, where it would cover the lock hint
const TOOLTIPS = { idle: "Hold to record a voice message", holding: "", locked: "Send voice message" };

const pulse = keyframes`
  50% { opacity: 0.25; }
`;

// the newest readings sit on the right, so the waveform grows in from that side
const liveBarsOf = (levels) => [...Array(Math.max(WAVEFORM_BARS - levels.length, 0)).fill(0), ...levels.map((level) => level * 100)];

const VoiceRecorder = ({ buttonSx, onRecordingChange }) => {
  const dispatch = useDispatch();
  const [phase, setPhase] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState([]);
  const [drag, setDrag] = useState({ left: 0, up: 0 });
  const phaseNow = useRef("idle");
  const recording = useRef(null);
  const attempts = useRef(0);
  const press = useRef(null);
  const micButton = useRef(null);

  const moveTo = (next) => {
    phaseNow.current = next;
    setPhase(next);
    onRecordingChange(next !== "idle");
  };

  const reset = () => {
    attempts.current += 1;
    recording.current = null;
    moveTo("idle");
    setDrag({ left: 0, up: 0 });
    setLevels([]);
    setElapsed(0);
  };

  useEffect(
    () => () => {
      attempts.current += 1;
      recording.current?.cancel();
    },
    []
  );

  const cancel = () => {
    const current = recording.current;
    reset();
    current?.cancel();
  };

  const discard = () => {
    cancel();
    micButton.current.focus();
  };

  const send = async () => {
    const current = recording.current;
    const wasHeld = phaseNow.current === "holding";
    reset();
    if (!current) return;
    const { file, duration, waveform } = await current.finish();
    if (duration < MIN_VOICE_SECONDS) return notify({ severity: "info", message: wasHeld ? HOLD_HINT : "Too short to send" });
    dispatch(SendVoiceMessage({ file, duration, waveform }));
  };

  const start = async (startPhase) => {
    moveTo(startPhase);
    const attempt = attempts.current;
    const isCurrent = () => attempts.current === attempt;
    try {
      const opened = await startVoiceRecording({
        onLevels: (all, seconds) => {
          if (!isCurrent()) return;
          setLevels(all.slice(-WAVEFORM_BARS));
          setElapsed(seconds);
          if (seconds >= MAX_VOICE_SECONDS) send();
        },
      });
      // cancelled, or gone from the screen, while the microphone was still opening
      if (!isCurrent()) return opened.cancel();
      recording.current = opened;
    } catch (error) {
      if (!isCurrent()) return;
      reset();
      notify({ severity: "error", message: error instanceof MicrophoneRefusal ? error.message : "Recording could not start" });
    }
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (phaseNow.current === "locked") return send();
    if (phaseNow.current !== "idle") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { pointerId: event.pointerId, pointerType: event.pointerType, x: event.clientX, y: event.clientY, at: performance.now() };
    start("holding");
  };

  const isThePress = (event) => phaseNow.current === "holding" && event.pointerId === press.current.pointerId;

  const onPointerMove = (event) => {
    if (!isThePress(event)) return;
    const left = Math.min(event.clientX - press.current.x, 0);
    const up = Math.min(event.clientY - press.current.y, 0);
    if (left < -CANCEL_PX) return cancel();
    if (up < -LOCK_PX) {
      setDrag({ left: 0, up: 0 });
      return moveTo("locked");
    }
    setDrag({ left, up });
  };

  const onPointerUp = (event) => {
    if (!isThePress(event)) return;
    // letting go before the microphone opened, say at the permission prompt, counts as a quick press
    const isHold = recording.current !== null && performance.now() - press.current.at >= QUICK_PRESS_MS;
    if (isHold) return send();
    if (press.current.pointerType === "mouse") return moveTo("locked");
    cancel();
    notify({ severity: "info", message: HOLD_HINT });
  };

  // keyboard only: Chrome drops a pointer's click when the icon under it changes mid-press
  const onClick = (event) => {
    if (event.detail !== 0) return;
    if (phaseNow.current === "locked") return send();
    if (phaseNow.current === "idle") start("locked");
  };

  const isLocked = phase === "locked";

  return (
    <>
      {phase !== "idle" && (
        <Stack
          role="group"
          aria-label="Recording a voice message"
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            position: "absolute",
            inset: 0,
            right: 54,
            zIndex: 1,
            px: 1.5,
            borderRadius: 3,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {isLocked && (
            <IconButton aria-label="Delete recording" onClick={discard} sx={{ ml: -0.75, color: "error.main" }}>
              <Trash size={20} />
            </IconButton>
          )}
          <Box aria-hidden sx={{ flexShrink: 0, width: 10, height: 10, borderRadius: "50%", bgcolor: "error.main", animation: `${pulse} 1.2s ease-in-out infinite` }} />
          <Typography variant="body2" sx={{ minWidth: 38, fontVariantNumeric: "tabular-nums" }}>
            {formatDuration(elapsed)}
          </Typography>
          <Waveform bars={liveBarsOf(levels)} progress={1} playedColor="primary.main" height={24} />
          {!isLocked && (
            <Stack
              direction="row"
              alignItems="center"
              sx={{ flexShrink: 0, color: "text.secondary", transform: `translateX(${drag.left}px)`, opacity: 1 + drag.left / CANCEL_PX }}
            >
              <CaretLeft size={14} aria-hidden />
              <Typography variant="caption">Slide to cancel</Typography>
            </Stack>
          )}
        </Stack>
      )}

      {phase === "holding" && (
        <Stack
          aria-hidden
          alignItems="center"
          spacing={0.25}
          sx={{
            position: "absolute",
            right: 4,
            bottom: "calc(100% + 8px)",
            zIndex: 1,
            px: 0.75,
            py: 1,
            borderRadius: 4,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            color: "text.secondary",
            transform: `translateY(${drag.up / 2}px)`,
          }}
        >
          <LockSimple size={18} />
          <CaretUp size={14} />
        </Stack>
      )}

      <Tooltip title={TOOLTIPS[phase]} disableTouchListener>
        <IconButton
          ref={micButton}
          aria-label={isLocked ? "Send voice message" : "Record a voice message"}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(event) => isThePress(event) && cancel()}
          onClick={onClick}
          onContextMenu={(event) => event.preventDefault()}
          sx={{
            ...buttonSx,
            touchAction: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
            transform: phase === "holding" ? "scale(1.15)" : "none",
            transition: "transform 120ms ease-out",
          }}
        >
          {isLocked ? <PaperPlaneTilt size={20} weight="fill" /> : <Microphone size={20} weight="fill" />}
        </IconButton>
      </Tooltip>
    </>
  );
};

export default VoiceRecorder;
