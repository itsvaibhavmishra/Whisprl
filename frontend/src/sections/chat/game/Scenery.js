import { Box } from "@mui/material";

const EDGE = "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)";

// art with pieces drawn into it, at the one width the pieces were placed for; a wider panel sees the scene blurred beside it
const Scenery = ({ art, width, isNarrower }) => (
  <>
    {isNarrower && (
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          backgroundImage: `url(${art.scene})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          filter: "blur(22px) brightness(0.8)",
          transform: "scale(1.1)",
        }}
      />
    )}
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        top: 0,
        left: "50%",
        zIndex: -1,
        width,
        aspectRatio: String(art.ratio),
        transform: "translateX(-50%)",
        backgroundImage: `url(${art.scene})`,
        backgroundSize: "100% auto",
        ...(isNarrower && { maskImage: EDGE, WebkitMaskImage: EDGE }),
      }}
    />
  </>
);

export default Scenery;
