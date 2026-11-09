import { useState } from "react";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";

import TourMascot from "@/sections/tour/TourMascot";
import TypedText from "@/sections/tour/TypedText";

const VoiceButton = ({ voice, isMuted, onToggleMute }) => {
  const label = (isMuted && "Unmute Whisprl") || (voice.isBlocked && "Tap to hear Whisprl") || "Mute Whisprl";
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={voice.isBlocked && !isMuted ? voice.playAgain : onToggleMute}
        size="small"
        sx={{
          color: voice.isBlocked && !isMuted ? "primary.main" : "text.secondary",
          animation: voice.isBlocked && !isMuted ? "tourPulse 1.4s ease-in-out infinite" : "none",
          "@keyframes tourPulse": { "50%": { transform: "scale(1.18)" } },
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {isMuted ? <SpeakerSlashIcon size={20} /> : <SpeakerHighIcon size={20} />}
      </IconButton>
    </Tooltip>
  );
};

const TourCard = ({ step, position, count, placement, voice, isMuted, onToggleMute, onBack, onNext, onSkip, onPlay }) => {
  const [finishedStep, setFinishedStep] = useState(null);
  const isWelcome = position === 0;
  const isLast = position === count - 1;

  return (
    <Box
      role="dialog"
      aria-label="A tour of Whisprl"
      sx={{
        position: "fixed",
        ...placement,
        p: 2.5,
        borderRadius: 4,
        bgcolor: "background.paper",
        boxShadow: 24,
        transition: "top 300ms ease, left 300ms ease, bottom 300ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
    >
      {isWelcome && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: -10, mb: 1 }}>
          <TourMascot size={140} readLevel={voice.readLevel} isGreeting />
        </Box>
      )}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        {!isWelcome && <TourMascot key={step.id} size={52} readLevel={voice.readLevel} />}
        <Box onClick={() => setFinishedStep(step.id)} sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
          <TypedText key={step.id} text={step.text} duration={voice.duration} isFinished={finishedStep === step.id} />
        </Box>
      </Stack>

      <Stack direction="row" sx={{ alignItems: "center", mt: 2, gap: 1 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "text.secondary" }}>{`${position + 1} of ${count}`}</Typography>
        {voice.hasClip && <VoiceButton voice={voice} isMuted={isMuted} onToggleMute={onToggleMute} />}
        <Box sx={{ flex: 1 }} />
        {isLast ? (
          <>
            <Button color="inherit" onClick={onSkip}>
              Maybe later
            </Button>
            <Button variant="contained" onClick={onPlay}>
              Play Jackaroo
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={onSkip}>
              Skip
            </Button>
            {!isWelcome && (
              <Button variant="outlined" color="inherit" onClick={onBack}>
                Back
              </Button>
            )}
            <Button variant="contained" onClick={onNext}>
              {isWelcome ? "Let's go" : "Next"}
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default TourCard;
