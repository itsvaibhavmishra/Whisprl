import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { CaretLeft, CaretUp, LockSimple, Microphone, PaperPlaneTilt, Trash } from "phosphor-react";
import { useDispatch } from "react-redux";

import { SendVoiceMessage } from "@/redux/slices/actions/attachmentActions";
import Waveform from "@/sections/chat/messages/Waveform";
import { notify } from "@/utils/notify";
import { formatDuration } from "@/utils/video";
import { MAX_VOICE_SECONDS, MIN_VOICE_SECONDS, MicrophoneRefusal, startVoiceRecording } from "@/utils/voice";

const CANCEL_PX = 90;
const LOCK_PX = 70;
const NO_DRAG = { left: 0, up: 0 };
// a mouse has nothing to hold, so a click shorter than this records hands-free instead
const QUICK_PRESS_MS = 250;
const HOLD_HINT = "Hold to record, let go to send";
// none while holding, where it would cover the lock hint
const TOOLTIPS = { idle: "Hold to record a voice message", holding: "", locked: "Send voice message" };

const pulse = keyframes`
  50% { opacity: 0.25; }
`;

// enough readings to fill a wide bar, with a narrow one clipping the oldest
const LIVE_BARS = 160;

// the newest readings sit on the right, so the waveform grows in from that side
const liveBarsOf = (levels) => [...Array(Math.max(LIVE_BARS - levels.length, 0)).fill(0), ...levels.map((level) => level * 100)];

// a slide only says what letting go will do, so sliding back before letting go undoes it
const releaseOf = ({ left, up }) => {
  const isPastCancel = left < -CANCEL_PX;
  const isPastLock = up < -LOCK_PX;
  if (isPastCancel && isPastLock) return left < up ? "cancel" : "lock";
  if (isPastCancel) return "cancel";
  return isPastLock ? "lock" : null;
};

const micLabelOf = (phase, pending) => {
  if (phase === "locked") return "Send voice message";
  if (pending === "cancel") return "Release to cancel the recording";
  if (pending === "lock") return "Release to keep recording hands-free";
  return "Record a voice message";
};

const VoiceRecorder = ({ buttonSx, onRecordingChange }) => {
  const dispatch = useDispatch();
  const [phase, setPhase] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState([]);
  const [drag, setDrag] = useState(NO_DRAG);
  const phaseNow = useRef("idle");
  const dragNow = useRef(NO_DRAG);
  const recording = useRef(null);
  const attempts = useRef(0);
  const press = useRef(null);
  const micButton = useRef(null);

  const moveTo = (next) => {
    phaseNow.current = next;
    setPhase(next);
    onRecordingChange(next !== "idle");
  };

  const moveDrag = (next) => {
    dragNow.current = next;
    setDrag(next);
  };

  const reset = () => {
    attempts.current += 1;
    recording.current = null;
    moveTo("idle");
    moveDrag(NO_DRAG);
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
          setLevels(all.slice(-LIVE_BARS));
          setElapsed(seconds);
          if (seconds < MAX_VOICE_SECONDS) return;
          const isPointingAtCancel = phaseNow.current === "holding" && releaseOf(dragNow.current) === "cancel";
          if (isPointingAtCancel) cancel();
          else send();
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

  const dragOf = (event) => ({ left: Math.min(event.clientX - press.current.x, 0), up: Math.min(event.clientY - press.current.y, 0) });

  const onPointerMove = (event) => {
    if (!isThePress(event)) return;
    moveDrag(dragOf(event));
  };

  const onPointerUp = (event) => {
    if (!isThePress(event)) return;
    const release = releaseOf(dragOf(event));
    if (release === "cancel") return cancel();
    if (release === "lock") return moveTo("locked");
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
  const pending = phase === "holding" ? releaseOf(drag) : null;
  const isCancelPending = pending === "cancel";
  const isLockPending = pending === "lock";
  const cancelSlide = Math.max(drag.left, -CANCEL_PX);

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
            right: 56,
            zIndex: 1,
            px: 1.5,
            borderRadius: "26px",
            bgcolor: "chat.raised",
            boxShadow: (theme) => `0 0 0 1px ${theme.palette.chat.edge}`,
          }}
        >
          {isLocked && (
            <IconButton aria-label="Delete recording" onClick={discard} sx={{ ml: -0.75, color: "text.secondary", "&:hover": { color: "error.main" } }}>
              <Trash size={20} />
            </IconButton>
          )}
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ flexGrow: 1, minWidth: 0, opacity: isCancelPending ? 0.4 : 1, transition: "opacity 120ms" }}>
            <Box aria-hidden sx={{ flexShrink: 0, width: 10, height: 10, borderRadius: "50%", bgcolor: "error.main", animation: `${pulse} 1.2s ease-in-out infinite`, "@media (prefers-reduced-motion: reduce)": { animation: "none" } }} />
            <Typography variant="body2" sx={{ minWidth: 38, fontVariantNumeric: "tabular-nums" }}>
              {formatDuration(elapsed)}
            </Typography>
            <Waveform bars={liveBarsOf(levels)} progress={1} playedColor="primary.main" />
          </Stack>
          {!isLocked && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.25}
              sx={{
                flexShrink: 0,
                px: 1,
                py: 0.25,
                borderRadius: 99,
                // solid, so the hint stays readable where it slides over the waveform
                bgcolor: "chat.raised",
                backgroundImage: (theme) => (isCancelPending ? `linear-gradient(${alpha(theme.palette.error.main, 0.14)}, ${alpha(theme.palette.error.main, 0.14)})` : "none"),
                color: isCancelPending ? "error.main" : "text.secondary",
                transform: `translateX(${cancelSlide}px)`,
                opacity: isCancelPending ? 1 : 1 + cancelSlide / (CANCEL_PX * 2),
              }}
            >
              {isCancelPending ? <Trash size={14} weight="bold" aria-hidden /> : <CaretLeft size={14} aria-hidden />}
              <Typography variant="caption" sx={{ fontWeight: isCancelPending ? 700 : undefined }}>
                {isCancelPending ? "Release to cancel" : "Slide to cancel"}
              </Typography>
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
            borderColor: isLockPending ? "primary.main" : "divider",
            bgcolor: isLockPending ? "primary.main" : "background.paper",
            color: isLockPending ? "primary.contrastText" : "text.secondary",
            transform: `translateY(${Math.max(drag.up, -LOCK_PX) / 2}px)`,
            transition: "background-color 120ms, border-color 120ms, color 120ms",
          }}
        >
          <LockSimple size={18} weight={isLockPending ? "fill" : "regular"} />
          <CaretUp size={14} />
        </Stack>
      )}

      <Tooltip title={TOOLTIPS[phase]} disableTouchListener>
        <IconButton
          ref={micButton}
          aria-label={micLabelOf(phase, pending)}
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
            transition: "transform 120ms ease-out, filter 160ms ease",
            ...(phase === "holding" && { "&, &:active": { transform: "scale(1.15)" } }),
          }}
        >
          {isLocked ? <PaperPlaneTilt size={20} weight="fill" /> : <Microphone size={20} weight="fill" />}
        </IconButton>
      </Tooltip>
    </>
  );
};

export default VoiceRecorder;
