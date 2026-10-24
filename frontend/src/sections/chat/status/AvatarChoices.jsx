import { useCallback, useEffect, useState } from "react";
import { ButtonBase, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { useReducedMotion } from "framer-motion";
import { CircleDashed } from "phosphor-react";

import StatusViewer from "@/sections/status/StatusViewer";

const FOCUS_RING = { outline: 2, outlineColor: "primary.main", outlineOffset: 3 };

const ChoiceIcon = ({ icon: Icon }) => (
  <ListItemIcon>
    <Icon size={18} weight="bold" />
  </ListItemIcon>
);

const AvatarChoices = ({ name, ownerId, hasStatus, other, menuAlign = "left", sx, children, ...button }) => {
  const isStill = useReducedMotion();
  const [anchor, setAnchor] = useState(null);
  const [isViewingStatus, setIsViewingStatus] = useState(false);
  const closeViewer = useCallback(() => setIsViewingStatus(false), []);
  const hasMenu = hasStatus && Boolean(other);
  const views = [hasStatus && "status", other?.noun].filter(Boolean);

  // a status that runs out or is taken down closes what it opened, so a later one never pops up unasked
  useEffect(() => {
    if (hasStatus) return;
    setAnchor(null);
    setIsViewingStatus(false);
  }, [hasStatus]);

  if (!views.length) return children ?? null;

  const choose = (event) => {
    if (hasMenu) setAnchor(event.currentTarget);
    else if (hasStatus) setIsViewingStatus(true);
    else other.onChoose();
  };

  const pick = (view) => {
    setAnchor(null);
    view();
  };

  return (
    <>
      <ButtonBase
        aria-label={`${name}, view ${views.join(" or ")}`}
        aria-haspopup={hasMenu ? "menu" : undefined}
        aria-expanded={hasMenu ? Boolean(anchor) : undefined}
        {...button}
        onClick={choose}
        sx={{ borderRadius: "50%", "&.Mui-focusVisible": FOCUS_RING, ...sx }}
      >
        {children}
      </ButtonBase>

      {hasMenu && (
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: menuAlign }}
          transformOrigin={{ vertical: "top", horizontal: menuAlign }}
          transitionDuration={isStill ? 0 : "auto"}
          slotProps={{ paper: { sx: { mt: 0.75, minWidth: 190 } } }}
        >
          <MenuItem onClick={() => pick(() => setIsViewingStatus(true))}>
            <ChoiceIcon icon={CircleDashed} />
            View status
          </MenuItem>
          <MenuItem onClick={() => pick(other.onChoose)}>
            <ChoiceIcon icon={other.icon} />
            {other.label}
          </MenuItem>
        </Menu>
      )}

      {isViewingStatus && <StatusViewer ownerIds={[ownerId]} startOwnerId={ownerId} onClose={closeViewer} />}
    </>
  );
};

export default AvatarChoices;
