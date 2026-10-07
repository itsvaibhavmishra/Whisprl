import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

const hop = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30% { transform: translateY(-3px); opacity: 1; }
`;

const TypingDots = ({ size }) => (
  <Box component="span" aria-hidden sx={{ display: "inline-flex", alignItems: "center", gap: `${size * 0.7}px`, verticalAlign: "middle" }}>
    {[0, 1, 2].map((dot) => (
      <Box
        key={dot}
        component="span"
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: "currentColor",
          animation: `${hop} 1.2s ${dot * 0.16}s infinite ease-in-out`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 0.7 },
        }}
      />
    ))}
  </Box>
);

export default TypingDots;
