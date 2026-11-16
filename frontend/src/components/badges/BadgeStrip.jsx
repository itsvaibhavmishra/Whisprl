import { Box, ButtonBase, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { badgesPathOf } from "@/routes/paths";
import { SHOWN_BESIDE_NAME, badgeArtAt, badgeCountOf } from "@/utils/badges";

const BadgeStrip = ({ badges: held = [], personId }) => {
  const navigate = useNavigate();
  const badges = held.filter((badge) => !badge.isHidden);
  if (badges.length === 0) return null;
  const more = badges.length - SHOWN_BESIDE_NAME;

  return (
    <ButtonBase
      aria-label={`${badgeCountOf(badges.length)}, open the badge gallery`}
      onClick={() => navigate(badgesPathOf(personId))}
      sx={{ alignSelf: "flex-start", gap: 0.5, mt: 1, ml: -0.5, p: 0.5, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
    >
      {badges.slice(0, SHOWN_BESIDE_NAME).map((badge) => (
        <Box key={badge.id} component="img" src={badgeArtAt(badge.art, 32)} alt="" sx={{ width: 32, height: 32, objectFit: "contain" }} />
      ))}
      {more > 0 && <Typography sx={{ px: 0.5, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>+{more}</Typography>}
    </ButtonBase>
  );
};

export default BadgeStrip;
