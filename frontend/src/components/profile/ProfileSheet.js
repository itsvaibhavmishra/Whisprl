import { Box, Dialog, IconButton, useMediaQuery } from "@mui/material";
import { ArrowLeft, X } from "phosphor-react";

import { onCover } from "@/components/ProfileCover";
import ProfileView from "@/components/profile/ProfileView";

// mounted inside cards, message bubbles and the status player, so its taps and keys must not reach theirs
const keepInside = (event) => event.stopPropagation();

const ProfileSheet = ({ person, startWithComposer = false, onClose }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isPhone}
      onClick={keepInside}
      onKeyDown={keepInside}
      onContextMenu={keepInside}
      onTouchStart={keepInside}
      onTouchMove={keepInside}
      onTouchEnd={keepInside}
      PaperProps={{
        "aria-label": person.firstName ? `${person.firstName}'s profile` : "Profile",
        sx: { width: { sm: 480 }, maxWidth: "100%", maxHeight: { sm: "min(88dvh, 880px)" }, borderRadius: { sm: 2 }, overflow: "hidden", backgroundImage: "none" },
      }}
    >
      <Box sx={{ overflowY: "auto" }}>
        <ProfileView person={person} size="sheet" startWithComposer={startWithComposer} />
      </Box>
      <IconButton
        aria-label="Close profile"
        onClick={onClose}
        sx={(theme) => ({ ...onCover(theme), position: "absolute", top: 12, left: 12, width: 40, height: 40 })}
      >
        {isPhone ? <ArrowLeft size={20} weight="bold" /> : <X size={20} weight="bold" />}
      </IconButton>
    </Dialog>
  );
};

export default ProfileSheet;
