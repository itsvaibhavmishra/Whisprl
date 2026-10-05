import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { Link } from "react-router-dom";

import mascot from "@/assets/icons/logo/Whisprl.webp";
import { COMMUNITY } from "@/config";
import { bubbleShape, TypingDots } from "@/sections/welcome/HeroConversation";
import { NO_MOTION } from "@/sections/welcome/styles";
import Wordmark from "@/sections/welcome/Wordmark";
import { PATH_AUTH } from "@/routes/paths";

const drift = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const BUBBLES = [
  { mine: false, text: "you around?", place: { top: "8%", left: "-22%" }, delay: 0 },
  { mine: true, text: "just logged in!", place: { top: "42%", right: "-22%" }, delay: 1.2 },
  { mine: false, typing: true, place: { bottom: "24%", left: "-14%" }, delay: 2.4 },
];

const FloatingBubble = ({ mine, text, typing, place, delay }) => (
  <Box
    sx={{
      ...bubbleShape(mine),
      ...place,
      position: "absolute",
      maxWidth: "none",
      whiteSpace: "nowrap",
      fontSize: 14,
      py: typing ? 1.5 : 1.1,
      boxShadow: (theme) => theme.customShadows?.z8,
      animation: `${drift} 6s ease-in-out ${delay}s infinite`,
      [NO_MOTION]: { animation: "none" },
    }}
  >
    {typing ? <TypingDots /> : text}
  </Box>
);

// Mascot centred on the full height, so it sits level with the form; the words hold the corners.
const BrandPanel = () => (
  <Box
    sx={{
      display: { xs: "none", md: "flex" },
      alignItems: "center",
      justifyContent: "center",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflow: "hidden",
      bgcolor: "background.paper",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        backgroundImage: (theme) =>
          `radial-gradient(${alpha(theme.palette.text.primary, 0.14)} 1px, transparent 1.5px)`,
        backgroundSize: "22px 22px",
        maskImage: "radial-gradient(ellipse 65% 55% at 50% 50%, black, transparent)",
        pointerEvents: "none",
      },
    }}
  >
    <Box sx={{ position: "absolute", top: 48, left: 48, right: 48 }}>
      <Box
        component={Link}
        to={PATH_AUTH.general.welcome}
        aria-label="Whisprl home"
        sx={{ display: "block", width: "fit-content", color: "text.primary", textDecoration: "none" }}
      >
        <Wordmark name="Whisprl" fontSize="3.5rem" />
      </Box>
      <Typography sx={{ mt: 2, fontSize: 22, fontWeight: 600, lineHeight: 1.3, maxWidth: "22ch", textWrap: "balance" }}>
        The real-time MERN chat app for you and your friends.
      </Typography>
    </Box>

    <Box sx={{ position: "relative" }}>
      <Box
        component="img"
        src={mascot}
        alt=""
        sx={{
          display: "block",
          width: "auto",
          height: "min(42vh, 420px)",
          aspectRatio: "600 / 648",
          maskImage: "linear-gradient(to bottom, black 72%, transparent)",
        }}
      />
      <Box aria-hidden="true" sx={{ display: { md: "none", lg: "block" } }}>
        {BUBBLES.map((bubble) => (
          <FloatingBubble key={bubble.text || "typing"} {...bubble} />
        ))}
      </Box>
    </Box>

    <Typography
      sx={{ position: "absolute", left: 48, right: 48, bottom: 48, color: "text.secondary", maxWidth: "36ch", textWrap: "pretty" }}
    >
      {COMMUNITY.people} people, {COMMUNITY.conversations} conversations and{" "}
      {COMMUNITY.messages} messages so far.
    </Typography>
  </Box>
);

export default BrandPanel;
