import { Box, Typography } from "@mui/material";

import Mascot from "@/assets/icons/logo/Whisprl.webp";
import { CoverArt } from "@/components/ProfileCover";
import useSettings from "@/hooks/useSettings";
import { colorPresets, defaultPreset } from "@/utils/colorPresets";

const CARD_HEIGHT = 112;
const MASCOT_WIDTH = { xs: 136, sm: 168 };
// the mascot is 600 by 648, so it stands taller than the card and its head rises above the top edge
const riseAbove = (width) => `${Math.round((width * 648) / 600) - CARD_HEIGHT}px`;
const eachWidth = (toCss) => ({ xs: toCss(MASCOT_WIDTH.xs), sm: toCss(MASCOT_WIDTH.sm) });

// the same doodles as a profile cover, in the accent the person picked
const ReleaseBanner = ({ title, subtitle, titleId, pattern = "whispers" }) => {
  const { themeColorPresets } = useSettings();
  const palette = (colorPresets.find((preset) => preset.name === themeColorPresets) ?? defaultPreset).label.toLowerCase();

  return (
    <Box sx={{ position: "relative", pt: eachWidth(riseAbove) }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
          minHeight: CARD_HEIGHT,
          pl: eachWidth((width) => `${width + 20}px`),
          pr: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          color: "common.white",
        }}
      >
        <CoverArt pattern={pattern} palette={palette} tileSize={360} />
        <Box sx={{ position: "relative", minWidth: 0, textShadow: "0 1px 8px rgba(0, 0, 0, 0.35)" }}>
          <Typography id={titleId} component="h2" sx={{ m: 0, fontSize: { xs: 21, sm: 24 }, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && <Typography sx={{ mt: 0.5, fontSize: 14, fontWeight: 600, opacity: 0.9 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      <Box
        component="img"
        src={Mascot}
        alt=""
        sx={{ position: "absolute", left: 8, bottom: 0, width: MASCOT_WIDTH, height: "auto", filter: "drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35))", pointerEvents: "none" }}
      />
    </Box>
  );
};

export default ReleaseBanner;
