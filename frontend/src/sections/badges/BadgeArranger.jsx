import { useState } from "react";
import { Box, Button, Dialog, IconButton, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { ArrowLineUpIcon, CaretDownIcon, CaretUpIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { SaveBadgeArrangement } from "@/redux/slices/actions/badgeActions";
import { SHOWN_BESIDE_NAME, badgeArtAt } from "@/utils/badges";

// a hidden badge sinks below the shown ones, so the first few shown are always the ones under the name
const shownFirst = (badges) => [...badges.filter((badge) => !badge.isHidden), ...badges.filter((badge) => badge.isHidden)];

const moved = (badges, from, to) => {
  const next = [...badges];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

const RowButton = ({ label, onClick, disabled, children }) => (
  <Tooltip title={label}>
    <span>
      <IconButton aria-label={label} onClick={onClick} disabled={disabled}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const BadgeArranger = ({ badges: held, onClose }) => {
  const dispatch = useDispatch();
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const isSaving = useIsLoading(SaveBadgeArrangement);
  const [badges, setBadges] = useState(() => shownFirst(held));
  const shownCount = badges.filter((badge) => !badge.isHidden).length;

  const toggleHidden = (id) => setBadges((current) => shownFirst(current.map((badge) => (badge.id === id ? { ...badge, isHidden: !badge.isHidden } : badge))));

  const save = async () => {
    const result = await dispatch(
      SaveBadgeArrangement({ order: badges.map((badge) => badge.id), hidden: badges.filter((badge) => badge.isHidden).map((badge) => badge.id) })
    );
    if (SaveBadgeArrangement.fulfilled.match(result)) onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      aria-labelledby="arrange-title"
      slotProps={{ paper: { sx: { borderRadius: { sm: 3 } } } }}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, pt: "calc(12px + env(safe-area-inset-top))", pb: 1.5 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Typography id="arrange-title" component="h2" sx={{ fontSize: 17, fontWeight: 800 }}>
          Arrange badges
        </Typography>
        <Button variant="contained" onClick={save} loading={isSaving}>
          Save
        </Button>
      </Stack>
      <Typography sx={{ px: 3, pb: 2, fontSize: 14, color: "text.secondary" }}>
        {`The first ${SHOWN_BESIDE_NAME} show under your name. Hidden badges stay in your gallery, faded, and nobody else sees them.`}
      </Typography>
      <Box component="ol" sx={{ m: 0, p: 0, pb: 3, listStyle: "none", overflowY: "auto" }}>
        {badges.map((badge, position) => {
          const isLastShown = position === shownCount - 1;
          return (
            <Stack
              component="li"
              key={badge.id}
              direction="row"
              sx={{
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1,
                borderTop: position === SHOWN_BESIDE_NAME && !badge.isHidden ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <Box
                component="img"
                src={badgeArtAt(badge.art, 40)}
                alt=""
                sx={{ width: 40, height: 40, objectFit: "contain", opacity: badge.isHidden ? 0.45 : 1 }}
              />
              <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 700, opacity: badge.isHidden ? 0.6 : 1, overflowWrap: "anywhere" }}>{badge.name}</Typography>
              <RowButton label={badge.isHidden ? `Show ${badge.name}` : `Hide ${badge.name}`} onClick={() => toggleHidden(badge.id)}>
                {badge.isHidden ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
              </RowButton>
              <RowButton
                label={`Move ${badge.name} to the top`}
                onClick={() => setBadges(moved(badges, position, 0))}
                disabled={badge.isHidden || position === 0}
              >
                <ArrowLineUpIcon size={20} />
              </RowButton>
              <RowButton
                label={`Move ${badge.name} up`}
                onClick={() => setBadges(moved(badges, position, position - 1))}
                disabled={badge.isHidden || position === 0}
              >
                <CaretUpIcon size={20} />
              </RowButton>
              <RowButton
                label={`Move ${badge.name} down`}
                onClick={() => setBadges(moved(badges, position, position + 1))}
                disabled={badge.isHidden || isLastShown}
              >
                <CaretDownIcon size={20} />
              </RowButton>
            </Stack>
          );
        })}
      </Box>
    </Dialog>
  );
};

export default BadgeArranger;
