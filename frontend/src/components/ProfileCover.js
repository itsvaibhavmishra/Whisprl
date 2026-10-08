import { Box } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { coverColorsOf, coverStyleOf, patternById } from "@/utils/covers";

const LAYER = { position: "absolute", inset: 0, pointerEvents: "none" };

// a control sitting on a cover brings its own frosted ground, so it reads on any photo or pattern
export const onCover = (theme) => ({
  color: "text.primary",
  bgcolor: alpha(theme.palette.background.paper, 0.85),
  backdropFilter: "blur(6px)",
  "&:hover": { bgcolor: theme.palette.background.paper },
  "@media (prefers-contrast: more)": { bgcolor: "background.paper", border: 1, borderColor: "divider" },
});
const PAGE_TILE = { xs: 576, sm: 720 };

const eachSize = (values, toCss) => Object.fromEntries(Object.entries(values).map(([breakpoint, value]) => [breakpoint, toCss(value)]));

const masked = (images, sizes) => ({ maskImage: images, WebkitMaskImage: images, maskSize: sizes, WebkitMaskSize: sizes });

// the doodles fade out round the photo that overlaps the cover's lower edge, so its ring stays clean
const aroundPhoto = ({ x, radius }) => `radial-gradient(circle at ${x}px 100%, #000 ${radius}px, transparent ${radius + 56}px)`;

export const CoverArt = ({ pattern, palette, tileSize = PAGE_TILE, photoAt, isPreview }) => {
  const isNight = useTheme().palette.mode === "dark";
  const { ground, ink } = coverColorsOf(palette, isNight, isPreview);
  const { tile } = patternById(pattern);
  const sizes = typeof tileSize === "number" ? { xs: tileSize } : tileSize;

  return (
    <>
      <Box aria-hidden sx={{ ...LAYER, background: ground }} />
      {tile && (
        <Box
          aria-hidden
          sx={{ ...LAYER, bgcolor: ink, ...masked(`url(${tile})`, eachSize(sizes, (size) => `${size}px`)), "@media (prefers-contrast: more)": { display: "none" } }}
        />
      )}
      {tile && photoAt && <Box aria-hidden sx={{ ...LAYER, background: ground, ...masked(eachSize(photoAt, aroundPhoto), "100% 100%") }} />}
    </>
  );
};

const ProfileCover = ({ profile, photoAt, sx, children }) => {
  const { pattern, palette } = coverStyleOf(profile);
  // Midnight is nearly the night page's own colour, so a hairline keeps its edge
  const isMidnight = !profile.cover && palette === "midnight";

  return (
    <Box sx={{ position: "relative", overflow: "hidden", ...(isMidnight && { outline: 1, outlineColor: "chat.edge", outlineOffset: -1 }), ...sx }}>
      {profile.cover ? (
        <Box aria-hidden sx={{ ...LAYER, backgroundImage: `url(${profile.cover})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : (
        <CoverArt pattern={pattern} palette={palette} photoAt={photoAt} />
      )}
      {children}
    </Box>
  );
};

export default ProfileCover;
