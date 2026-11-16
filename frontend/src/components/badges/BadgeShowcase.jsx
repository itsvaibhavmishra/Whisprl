import { useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { CaretLeftIcon, CaretRightIcon, ShareFatIcon, XIcon } from "@phosphor-icons/react";

import BadgeStage, { StageFloor } from "@/components/badges/BadgeStage";
import { shareBadge } from "@/components/badges/shareBadge";
import { SHOWCASE_SIZE, badgeArtAt, badgeDateOf } from "@/utils/badges";

const ART = SHOWCASE_SIZE;
const SWIPE = 50;
const INK = "#F4EEFF";
const INK_SOFT = "rgba(244, 238, 255, 0.72)";

const sideArrow = (side) => ({
  position: "absolute",
  top: "50%",
  [side]: { xs: 4, sm: 24 },
  transform: "translateY(-50%)",
  color: INK_SOFT,
  width: 48,
  height: 48,
});

const Flourish = ({ children }) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "center", color: INK }}>
    <Box aria-hidden sx={{ width: 56, height: "1px", background: `linear-gradient(90deg, transparent, ${INK_SOFT})` }} />
    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{children}</Typography>
    <Box aria-hidden sx={{ width: 56, height: "1px", background: `linear-gradient(270deg, transparent, ${INK_SOFT})` }} />
  </Stack>
);

const LevelRow = ({ badge }) => (
  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center" }} role="list" aria-label="Levels">
    {badge.levels.map((art, level) => (
      <Stack
        key={art}
        direction="row"
        sx={{ alignItems: "center" }}
        role="listitem"
        aria-label={`Level ${level + 1}${level === badge.level ? ", reached" : ""}`}
      >
        {level > 0 && <Box aria-hidden sx={{ width: 28, height: "1px", mx: 1, bgcolor: INK_SOFT, opacity: 0.5 }} />}
        <Box
          sx={{
            p: 0.5,
            borderRadius: "50%",
            border: 2,
            borderColor: level === badge.level ? "primary.light" : "transparent",
            opacity: level > badge.level ? 0.45 : 1,
          }}
        >
          <Box component="img" src={badgeArtAt(art, 44)} alt="" sx={{ display: "block", width: 44, height: 44, objectFit: "contain" }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

const earnedLineOf = ({ awardedAt, expiresAt }) =>
  [`Earned on ${badgeDateOf(awardedAt)}`, expiresAt && `until ${badgeDateOf(expiresAt)}`].filter(Boolean).join(", ");

// opened from a gallery to page through the rest, or offered to be claimed with nothing else to do
const BadgeShowcase = ({ badges, startAt = 0, personId, canShare = false, claim, onClose }) => {
  const [index, setIndex] = useState(startAt);
  const touchStart = useRef(null);
  const badge = badges[index];
  const canPage = !claim && badges.length > 1;
  const go = (step) => setIndex((current) => Math.min(badges.length - 1, Math.max(0, current + step)));

  useEffect(() => {
    if (!canPage) return undefined;
    const onKey = (event) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const endSwipe = (event) => {
    const distance = event.changedTouches[0].clientX - (touchStart.current ?? 0);
    if (canPage && Math.abs(distance) > SWIPE) go(distance < 0 ? 1 : -1);
    touchStart.current = null;
  };

  return (
    <Dialog
      open
      fullScreen
      onClose={claim ? undefined : onClose}
      aria-labelledby="showcase-title"
      slotProps={{ paper: { sx: { bgcolor: "#0C0A13", color: INK, backgroundImage: "none" } } }}
    >
      <Box
        onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
        onTouchEnd={endSwipe}
        sx={{
          position: "relative",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          pt: "calc(16px + env(safe-area-inset-top))",
          pb: "calc(28px + env(safe-area-inset-bottom))",
        }}
      >
        <BadgeStage />
        {!claim && (
          <IconButton
            aria-label="Close"
            onClick={onClose}
            sx={{ position: "absolute", top: "calc(12px + env(safe-area-inset-top))", right: 12, color: INK, width: 48, height: 48 }}
          >
            <XIcon size={26} />
          </IconButton>
        )}

        <Stack sx={{ position: "relative", alignItems: "center", textAlign: "center", px: 4, mt: { xs: 8, sm: 10 } }}>
          {claim && <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", color: INK_SOFT }}>New badge</Typography>}
          <Typography id="showcase-title" component="h2" sx={{ fontSize: { xs: 26, sm: 32 }, fontWeight: 800, overflowWrap: "anywhere" }}>
            {badge.name}
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 420, color: INK_SOFT, textWrap: "pretty" }}>{badge.description}</Typography>
        </Stack>

        <Box sx={{ position: "relative", flex: 1, display: "grid", placeItems: "center", minHeight: ART + 60, overflow: "hidden" }}>
          <StageFloor sx={{ top: `calc(50% + ${ART / 2 - 14}px)` }} />
          <Box
            component="img"
            key={badge.id}
            src={badgeArtAt(badge.art, ART)}
            alt=""
            sx={{ width: ART, height: ART, objectFit: "contain", filter: "drop-shadow(0 18px 30px rgba(0, 0, 0, 0.55))" }}
          />
          {canPage && index > 0 && (
            <IconButton aria-label="Previous badge" onClick={() => go(-1)} sx={sideArrow("left")}>
              <CaretLeftIcon size={34} />
            </IconButton>
          )}
          {canPage && index < badges.length - 1 && (
            <IconButton aria-label="Next badge" onClick={() => go(1)} sx={sideArrow("right")}>
              <CaretRightIcon size={34} />
            </IconButton>
          )}
        </Box>

        <Stack spacing={2.5} sx={{ position: "relative", alignItems: "center", px: 3 }}>
          {badge.levels && <LevelRow badge={badge} />}
          {!claim && (
            <Stack spacing={0.75} sx={{ alignItems: "center" }}>
              <Flourish>Earned</Flourish>
              <Typography sx={{ fontSize: 14, color: INK_SOFT }}>{earnedLineOf(badge)}</Typography>
            </Stack>
          )}
        </Stack>

        <Box sx={{ position: "relative", mt: 5, px: 3, display: "flex", justifyContent: "center" }}>
          {claim && (
            <Button variant="contained" size="large" onClick={claim} sx={{ minWidth: 240, borderRadius: 99 }}>
              Claim
            </Button>
          )}
          {!claim && canShare && (
            <Button
              variant="contained"
              size="large"
              startIcon={<ShareFatIcon size={20} />}
              onClick={() => shareBadge(badge, personId)}
              sx={{ minWidth: 240, borderRadius: 99 }}
            >
              Share
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default BadgeShowcase;
