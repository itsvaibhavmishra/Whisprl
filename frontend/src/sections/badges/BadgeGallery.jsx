import { Box, Button, Stack } from "@mui/material";
import { CaretRightIcon } from "@phosphor-icons/react";
import { Link as RouterLink } from "react-router-dom";

import BadgeGrid from "@/sections/badges/BadgeGrid";
import { PaneEmpty, PaneSection } from "@/components/Pane";
import { badgeProgressPathOf } from "@/routes/paths";
import BadgeHero from "@/sections/badges/BadgeHero";
import { firstWordOf } from "@/utils/names";

const BadgeGallery = ({ person, isOwn }) => {
  const badges = person.badges ?? [];
  const progressLink = badges.length > 0 && (
    <Button component={RouterLink} to={badgeProgressPathOf(person._id)} size="small" endIcon={<CaretRightIcon size={14} weight="bold" />}>
      See progress
    </Button>
  );

  return (
    <Stack spacing={4}>
      <BadgeHero person={person} action={progressLink} />
      {badges.length === 0 ? (
        <PaneEmpty text={`${firstWordOf(person.name)} has no badges yet.`} />
      ) : (
        <PaneSection label="Badge gallery">
          <Box sx={{ mt: 2 }}>
            <BadgeGrid badges={badges} personId={person._id} canShare={isOwn} />
          </Box>
        </PaneSection>
      )}
    </Stack>
  );
};

export default BadgeGallery;
