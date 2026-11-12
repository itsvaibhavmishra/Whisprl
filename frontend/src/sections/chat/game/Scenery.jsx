import { Box } from "@mui/material";

const FOOT = "linear-gradient(180deg, #000 82%, transparent 100%)";

// art with pieces drawn into it, at least as wide as the panel, so the room always fills the screen even where the masthead narrows
const Scenery = ({ art, width }) => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      top: 0,
      left: "50%",
      zIndex: -1,
      width: `max(${width}px, 100%)`,
      aspectRatio: String(art.ratio),
      transform: "translateX(-50%)",
      backgroundImage: `url(${art.scene})`,
      backgroundSize: "100% auto",
      ...(art.fadesAtFoot && { maskImage: FOOT, WebkitMaskImage: FOOT }),
    }}
  />
);

export default Scenery;
