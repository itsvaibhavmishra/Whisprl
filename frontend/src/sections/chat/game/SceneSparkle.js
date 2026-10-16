import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useReducedMotion } from "framer-motion";

const twinkle = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(0.7); }
  50% { opacity: 1; transform: scale(1); }
`;

const drift = keyframes`
  0% { transform: translate(0, 0); opacity: 0; }
  12% { opacity: 1; }
  50% { transform: translate(34px, -26px); }
  88% { opacity: 1; }
  100% { transform: translate(72px, 6px); opacity: 0; }
`;

// placed over the sparkles already painted into the scene, so the artwork keeps its own composition
const STARS = [
  { left: 36, top: 7, size: 7, every: 3.1, from: 0 },
  { left: 52, top: 4, size: 5, every: 2.6, from: 0.9 },
  { left: 64, top: 12, size: 6, every: 3.6, from: 1.7 },
  { left: 18, top: 16, size: 4, every: 2.9, from: 0.4 },
  { left: 74, top: 5, size: 4, every: 3.3, from: 2.2 },
];

const FIREFLIES = [
  { left: 14, top: 62, every: 13, from: 0 },
  { left: 68, top: 72, every: 16, from: 4.5 },
  { left: 42, top: 55, every: 19, from: 9 },
];

const SceneSparkle = () => {
  const isStill = useReducedMotion();
  if (isStill) return null;

  return (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {STARS.map(({ left, top, size, every, from }) => (
        <Box
          key={`star-${left}-${top}`}
          sx={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            borderRadius: "50%",
            bgcolor: "#FFF6D8",
            boxShadow: "0 0 8px 2px rgba(255, 244, 198, 0.9)",
            animation: `${twinkle} ${every}s ease-in-out ${from}s infinite`,
          }}
        />
      ))}
      {FIREFLIES.map(({ left, top, every, from }) => (
        <Box
          key={`firefly-${left}-${top}`}
          sx={{
            position: "absolute",
            left: `${left}%`,
            top: `${top}%`,
            width: 5,
            height: 5,
            borderRadius: "50%",
            bgcolor: "#FFE9A3",
            boxShadow: "0 0 10px 3px rgba(255, 214, 110, 0.85)",
            animation: `${drift} ${every}s ease-in-out ${from}s infinite`,
          }}
        />
      ))}
    </Box>
  );
};

export default SceneSparkle;
