import { useState } from "react";
import { Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { useDispatch } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import useIsLoading from "@/hooks/useIsLoading";
import { SendAnnouncement } from "@/redux/slices/actions/adminActions";
import { PATH_DASHBOARD } from "@/routes/paths";
import AnnouncementPreview from "@/sections/admin/AnnouncementPreview";
import PillGroup from "@/sections/admin/PillGroup";

const MAX_TEXT = 500;
const MAX_LABEL = 30;

export const AUDIENCES = [
  { value: "everyone", label: "Everyone" },
  { value: "android", label: "Android app" },
  { value: "web", label: "Website" },
];

const BUTTONS = [
  { value: "none", label: "No button" },
  { value: "challenge", label: "Challenge Whisprl", button: { kind: "challenge", label: "Challenge Whisprl" } },
  { value: "contacts", label: "Contacts", button: { kind: "open", label: "Invite friends", to: PATH_DASHBOARD.general.contacts } },
  { value: "status", label: "Status", button: { kind: "open", label: "See status", to: PATH_DASHBOARD.general.status } },
  { value: "profile", label: "Profile", button: { kind: "open", label: "Edit profile", to: PATH_DASHBOARD.general.profile } },
  { value: "settings", label: "Settings", button: { kind: "open", label: "Open settings", to: PATH_DASHBOARD.general.settings } },
];

const peopleCount = (count) => (count === 1 ? "1 person" : `${count.toLocaleString()} people`);

const AnnouncementForm = ({ sizes, onSent }) => {
  const dispatch = useDispatch();
  const isSending = useIsLoading(SendAnnouncement);
  const [text, setText] = useState("");
  const [destination, setDestination] = useState("none");
  const [label, setLabel] = useState("");
  const [audience, setAudience] = useState("everyone");
  const [isPushed, setIsPushed] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const size = sizes?.[audience];
  const chosen = BUTTONS.find((option) => option.value === destination).button;
  const button = chosen && { ...chosen, label };
  const isReady = text.trim() && text.length <= MAX_TEXT && (!button || button.label.trim()) && size > 0;

  const send = () =>
    dispatch(SendAnnouncement({ text, button, audience, isPushed })).then((result) => {
      if (!SendAnnouncement.fulfilled.match(result)) return;
      setText("");
      setDestination("none");
      onSent();
    });

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, alignItems: "start", mt: 4 }}>
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          multiline
          minRows={4}
          label="Message"
          value={text}
          onChange={(event) => setText(event.target.value)}
          error={text.length > MAX_TEXT}
          helperText={`**bold**, and [words](/contacts) for a link in the app. ${text.length}/${MAX_TEXT}`}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <TextField
            select
            label="Button"
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              setLabel(BUTTONS.find((option) => option.value === event.target.value).button?.label ?? "");
            }}
            sx={{ minWidth: 180 }}
          >
            {BUTTONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {button && (
            <TextField
              fullWidth
              label="Button says"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              slotProps={{ htmlInput: { maxLength: MAX_LABEL } }}
            />
          )}
        </Stack>
        <Box>
          <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>Who gets it</Typography>
          <PillGroup label="Who gets it" options={AUDIENCES} value={audience} onChange={setAudience} />
          <Typography sx={{ mt: 1, fontSize: 13, color: "text.secondary" }}>
            {size === undefined ? "Counting…" : `${peopleCount(size)}, in their chat with Whisprl`}
          </Typography>
        </Box>
        <FormControlLabel
          control={<Switch checked={isPushed} onChange={(event) => setIsPushed(event.target.checked)} />}
          label="Also send a notification to Android"
        />
        <Button variant="contained" size="large" disabled={!isReady} loading={isSending} onClick={() => setIsConfirming(true)} sx={{ alignSelf: "flex-start" }}>
          {size > 0 ? `Send to ${peopleCount(size)}` : "Send"}
        </Button>
      </Stack>

      <Box>
        <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>Preview</Typography>
        <AnnouncementPreview text={text} button={button} />
      </Box>

      {isConfirming && (
        <ConfirmDialog
          title={`Send to ${peopleCount(size)}?`}
          text="It arrives in their chat with Whisprl straight away, and can't be edited or taken back."
          action="Send"
          onConfirm={send}
          onClose={() => setIsConfirming(false)}
        />
      )}
    </Box>
  );
};

export default AnnouncementForm;
