import { Box } from "@mui/material";

const KEY_STEP = 0.05;
const MIN_BAR_PERCENT = 12;

const Waveform = ({ bars, progress = 0, playedColor, restColor, height = 24, onSeek, valueText }) => {
  const seekTo = (fraction) => onSeek(Math.min(Math.max(fraction, 0), 1));

  const seekable = onSeek && {
    role: "slider",
    tabIndex: 0,
    "aria-label": "Position",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(progress * 100),
    "aria-valuetext": valueText,
    // the bubble around it opens its details on a click, which a seek is not
    onClick: (event) => {
      event.stopPropagation();
      const box = event.currentTarget.getBoundingClientRect();
      seekTo((event.clientX - box.left) / box.width);
    },
    onKeyDown: (event) => {
      const step = { ArrowRight: KEY_STEP, ArrowLeft: -KEY_STEP }[event.key];
      if (!step) return;
      event.preventDefault();
      seekTo(progress + step);
    },
  };

  return (
    // a narrow space clips the oldest bars, at the start, rather than the newest
    <Box
      {...seekable}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "2px",
        height,
        minWidth: 0,
        flexGrow: 1,
        overflow: "hidden",
        cursor: onSeek ? "pointer" : "default",
      }}
    >
      {bars.map((bar, index) => (
        <Box
          key={index}
          sx={{
            flex: 1,
            minWidth: 2,
            maxWidth: 4,
            height: `${Math.max(bar, MIN_BAR_PERCENT)}%`,
            borderRadius: 1,
            bgcolor: (index + 0.5) / bars.length <= progress ? playedColor : restColor,
          }}
        />
      ))}
    </Box>
  );
};

export default Waveform;
