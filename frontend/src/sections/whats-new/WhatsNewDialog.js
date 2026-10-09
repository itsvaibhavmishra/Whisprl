import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { MarkWhatsNewSeen } from "@/redux/slices/actions/onboardingActions";
import ReleaseBanner from "@/sections/whats-new/ReleaseBanner";
import ReleaseHighlights from "@/sections/whats-new/ReleaseHighlights";
import { releaseTitle, unseenReleaseFor } from "@/sections/whats-new/whatsNew";

// waits for the unlock dialog to be dealt with, so the two never stack
const isEncryptionSettled = ({ status, unlockOpen }) => status === "ready" || (status === "locked" && !unlockOpen);

const WhatsNewDialog = () => {
  const dispatch = useDispatch();
  const release = useSelector((state) => unseenReleaseFor(state.user.user));
  const isReady = useSelector((state) => isEncryptionSettled(state.encryption));
  const [closedVersion, setClosedVersion] = useState(null);

  if (!release || !isReady || closedVersion === release.version) return null;

  const close = () => {
    setClosedVersion(release.version);
    dispatch(MarkWhatsNewSeen(release.version));
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs" aria-labelledby="whats-new-title" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogContent sx={{ pt: 2 }}>
        <ReleaseBanner title="What's new" subtitle={releaseTitle(release)} titleId="whats-new-title" />
        <Box sx={{ mt: 2.5 }}>
          <ReleaseHighlights highlights={release.highlights} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" size="large" fullWidth onClick={close}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsNewDialog;
