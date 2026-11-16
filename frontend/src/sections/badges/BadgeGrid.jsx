import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";

import BadgeShowcase from "@/components/badges/BadgeShowcase";
import { SHOWCASE_SIZE, badgeArtAt, badgeDayOf } from "@/utils/badges";

// the showcase pages through every badge the screen holds, not just this grid's, so Progress can move across months
const BadgeGrid = ({ badges, pagesThrough = badges, personId, canShare = false, withDates = false }) => {
  const [openedAt, setOpenedAt] = useState(null);

  return (
    <>
      <Box
        component="ul"
        sx={{
          m: 0,
          p: 0,
          listStyle: "none",
          display: "grid",
          gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(auto-fill, minmax(136px, 1fr))" },
          gap: { xs: 1, sm: 2 },
        }}
      >
        {badges.map((badge) => (
          <li key={badge.id}>
            <ButtonBase
              onClick={() => setOpenedAt(pagesThrough.findIndex((held) => held.id === badge.id))}
              aria-label={badge.isHidden ? `${badge.name}, hidden from your profile` : undefined}
              sx={{
                width: "100%",
                flexDirection: "column",
                gap: 1.25,
                px: 1,
                py: 2,
                borderRadius: 3,
                opacity: badge.isHidden ? 0.45 : 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box component="img" src={badgeArtAt(badge.art, SHOWCASE_SIZE)} alt="" sx={{ width: 88, height: 88, maxWidth: "100%", objectFit: "contain" }} />
              <Typography sx={{ width: "100%", fontSize: 14, fontWeight: 700, textAlign: "center", overflowWrap: "anywhere" }}>{badge.name}</Typography>
              {withDates && <Typography sx={{ mt: -0.75, fontSize: 12, color: "text.secondary" }}>{badgeDayOf(badge.awardedAt)}</Typography>}
              {badge.isHidden && <Typography sx={{ mt: -0.75, fontSize: 12, fontWeight: 700, color: "text.secondary" }}>Hidden</Typography>}
            </ButtonBase>
          </li>
        ))}
      </Box>
      {openedAt !== null && (
        <BadgeShowcase badges={pagesThrough} startAt={openedAt} personId={personId} canShare={canShare} onClose={() => setOpenedAt(null)} />
      )}
    </>
  );
};

export default BadgeGrid;
