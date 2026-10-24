import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { BellRingingIcon } from "@phosphor-icons/react";

import useSettings from "@/hooks/useSettings";
import { askForNotifications, notificationPermission } from "@/utils/notifications";

// a phone's permission belongs to the phone, not the account, so each phone is asked once
const ASKED_KEY = "notifications-asked";

const wasAsked = () => {
  try {
    return localStorage.getItem(ASKED_KEY) === "true";
  } catch {
    return true;
  }
};

const rememberAsked = () => {
  try {
    localStorage.setItem(ASKED_KEY, "true");
  } catch {
    // with storage refused the prompt only asks again next time
  }
};

const NotificationsPrompt = () => {
  const { notifications, onSetNotifications } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  // a phone that already allows them, as Android 12 and older do, is switched on without asking
  useEffect(() => {
    if (notifications || wasAsked()) return;
    notificationPermission().then((permission) => {
      if (permission === "default") return setIsOpen(true);
      rememberAsked();
      if (permission === "granted") onSetNotifications(true);
    }, rememberAsked);
  }, [notifications, onSetNotifications]);

  const close = () => {
    rememberAsked();
    setIsOpen(false);
  };

  const turnOn = async () => {
    close();
    if ((await askForNotifications().catch(() => "denied")) === "granted") onSetNotifications(true);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      fullWidth
      maxWidth="xs"
      aria-labelledby="notifications-prompt-title"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle id="notifications-prompt-title" sx={{ pb: 0.5 }}>
        <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BellRingingIcon size={24} weight="duotone" />
          Turn on notifications
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
          Hear about a message even when Whisprl is closed. Muted chats stay quiet, and you can switch this off in Settings.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={close}>
          Not now
        </Button>
        <Button variant="contained" onClick={turnOn}>
          Turn on
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationsPrompt;
