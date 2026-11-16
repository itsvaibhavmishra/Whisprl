import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

const twinkle = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(0.7); }
  50% { opacity: 0.9; transform: scale(1); }
`;

// fixed places rather than random ones, so the sparkles sit in the same spots every time it opens
const SPARKLES = [
  { left: "38%", top: "6%", size: 4, delay: 0 },
  { left: "46%", top: "12%", size: 3, delay: 1.2 },
  { left: "58%", top: "8%", size: 5, delay: 0.6 },
  { left: "63%", top: "17%", size: 3, delay: 2.1 },
  { left: "33%", top: "18%", size: 3, delay: 1.7 },
  { left: "52%", top: "22%", size: 4, delay: 0.3 },
  { left: "70%", top: "10%", size: 3, delay: 2.6 },
  { left: "27%", top: "11%", size: 2, delay: 0.9 },
  { left: "44%", top: "28%", size: 2, delay: 1.5 },
  { left: "66%", top: "26%", size: 3, delay: 0.1 },
];

const LAYER = { position: "absolute", pointerEvents: "none" };

// a spotlight from above onto a round stage, drawn in gradients so it stays sharp at any size and costs nothing to load
const BadgeStage = () => (
  <Box aria-hidden sx={{ ...LAYER, inset: 0, overflow: "hidden", background: "linear-gradient(180deg, #1B1430 0%, #120E1F 45%, #0C0A13 100%)" }}>
    <Box
      sx={{
        ...LAYER,
        top: "-12%",
        left: "50%",
        width: "60%",
        height: "38%",
        transform: "translateX(-50%)",
        background: "radial-gradient(ellipse at 50% 30%, rgba(236, 226, 255, 0.55), rgba(183, 148, 255, 0.18) 45%, transparent 70%)",
        filter: "blur(18px)",
      }}
    />
    <Box
      sx={{
        ...LAYER,
        top: 0,
        left: "50%",
        width: "140%",
        height: "60%",
        transform: "translateX(-50%)",
        background: "conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(220, 205, 255, 0.16) 180deg, transparent 200deg)",
        filter: "blur(8px)",
      }}
    />
    {SPARKLES.map(({ left, top, size, delay }) => (
      <Box
        key={`${left}-${top}`}
        sx={{
          ...LAYER,
          left,
          top,
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: "#F4EEFF",
          boxShadow: "0 0 6px rgba(244, 238, 255, 0.8)",
          opacity: 0.15,
          // already partway through, so the sparkles open calm instead of flaring together before their delays run out
          animation: `${twinkle} 3.4s ease-in-out -${delay}s infinite both`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 0.5 },
        }}
      />
    ))}
  </Box>
);

// the round floor the badge stands on, placed by the badge itself so the two always meet
export const StageFloor = ({ sx }) => (
  <Box aria-hidden sx={{ ...LAYER, left: 0, right: 0, height: 0, ...sx }}>
    <Box
      sx={{
        ...LAYER,
        top: 0,
        left: "50%",
        width: "130%",
        height: 220,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 45%, rgba(214, 196, 255, 0.28), rgba(140, 110, 220, 0.08) 45%, transparent 70%)",
      }}
    />
    {[0.62, 0.86].map((scale) => (
      <Box
        key={scale}
        sx={{
          ...LAYER,
          top: 0,
          left: "50%",
          width: `${130 * scale}%`,
          height: 220 * scale,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "1px solid rgba(255, 255, 255, 0.07)",
        }}
      />
    ))}
  </Box>
);

export default BadgeStage;
