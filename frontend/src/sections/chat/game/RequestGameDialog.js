import { useState } from "react";
import { Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, IconButton, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { alpha } from "@mui/material/styles";
import { Plus, X } from "phosphor-react";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { RequestGame } from "@/redux/slices/actions/gameActions";
import ClosableTitle from "@/sections/chat/game/ClosableTitle";
import { REQUEST_KINDS } from "@/utils/gameRequestKinds";

const MAX_NAME = 60;
const MAX_DETAILS = 1000;
const MAX_LINKS = 3;

const KindChoice = ({ kind, isSelected, onSelect }) => (
  <ButtonBase
    role="radio"
    aria-checked={isSelected}
    onClick={onSelect}
    sx={{
      display: "flex",
      flexDirection: { xs: "row", sm: "column" },
      alignItems: { xs: "center", sm: "flex-start" },
      justifyContent: "flex-start",
      gap: 1.25,
      p: 1.5,
      borderRadius: 3,
      border: 1.5,
      borderColor: isSelected ? kind.color : "divider",
      bgcolor: isSelected ? alpha(kind.color, 0.12) : "transparent",
      textAlign: "left",
      transition: "border-color 160ms ease, background-color 160ms ease",
      "&:hover": { borderColor: kind.color },
      "&.Mui-focusVisible": { outline: 2, outlineColor: kind.color, outlineOffset: 2 },
    }}
  >
    <Box sx={{ width: 36, height: 36, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 2, color: kind.color, bgcolor: alpha(kind.color, 0.16) }}>
      <kind.Icon size={20} weight="fill" />
    </Box>
    <Box>
      <Typography sx={{ fontSize: 14.5, fontWeight: 800 }}>{kind.choice}</Typography>
      <Typography sx={{ mt: 0.25, fontSize: 12.5, lineHeight: 1.35, color: "text.secondary" }}>{kind.hint}</Typography>
    </Box>
  </ButtonBase>
);

const LinkFields = ({ links, onChange }) => (
  <Stack spacing={1}>
    {links.map((link, position) => (
      <TextField
        key={position}
        size="small"
        value={link}
        onChange={(event) => onChange(links.map((each, index) => (index === position ? event.target.value : each)))}
        placeholder="https://"
        inputProps={{ "aria-label": `Link ${position + 1}`, inputMode: "url" }}
        InputProps={{
          endAdornment: links.length > 1 && (
            <IconButton size="small" aria-label={`Remove link ${position + 1}`} onClick={() => onChange(links.filter((_, index) => index !== position))} sx={{ mr: -0.75 }}>
              <X size={14} weight="bold" />
            </IconButton>
          ),
        }}
      />
    ))}
    {links.length < MAX_LINKS && (
      <Button size="small" color="inherit" startIcon={<Plus size={14} weight="bold" />} onClick={() => onChange([...links, ""])} sx={{ alignSelf: "flex-start" }}>
        Add another link
      </Button>
    )}
  </Stack>
);

const RequestGameDialog = ({ initialName = "", onClose }) => {
  const dispatch = useDispatch();
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const isSending = useIsLoading(RequestGame);
  const [kind, setKind] = useState("");
  const [name, setName] = useState(initialName);
  const [links, setLinks] = useState([""]);
  const [details, setDetails] = useState("");
  const isOwnIdea = kind === "original";

  const send = async (event) => {
    event.preventDefault();
    const result = await dispatch(RequestGame({ kind, name: name.trim(), links: links.map((link) => link.trim()).filter(Boolean), details: details.trim() }));
    if (RequestGame.fulfilled.match(result)) onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      PaperProps={{ "aria-label": "Request a game", sx: { pt: "env(safe-area-inset-top)", pb: "env(safe-area-inset-bottom)" } }}
    >
      <Box component="form" onSubmit={send} sx={{ display: "flex", flexDirection: "column", height: isPhone ? "100%" : "auto" }}>
        <ClosableTitle title="Request a game" onClose={onClose} sx={{ pb: 0 }} />
        <DialogContent>
          <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>Ask for a game you would like to play here, or pitch one nobody has made yet.</Typography>

          <Typography id="request-kind" sx={{ mt: 3, mb: 1.25, fontSize: 14, fontWeight: 800 }}>
            What kind of game?
          </Typography>
          <Box role="radiogroup" aria-labelledby="request-kind" sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
            {REQUEST_KINDS.map((option) => (
              <KindChoice key={option.value} kind={option} isSelected={kind === option.value} onSelect={() => setKind(option.value)} />
            ))}
          </Box>

          <TextField
            label={isOwnIdea ? "What's it called?" : "Which game?"}
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: MAX_NAME }}
            required
            fullWidth
            sx={{ mt: 3 }}
          />

          <Typography sx={{ mt: 3, fontSize: 14, fontWeight: 800 }}>Links (optional)</Typography>
          <Typography sx={{ mt: 0.25, mb: 1.25, fontSize: 13, color: "text.secondary" }}>
            {isOwnIdea ? "A video or a page that shows how it works." : "The rules, a video, or the game's own page."}
          </Typography>
          <LinkFields links={links} onChange={setLinks} />

          <TextField
            label={isOwnIdea ? "How is it played? (optional)" : "Anything else? (optional)"}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            inputProps={{ maxLength: MAX_DETAILS }}
            helperText={`${details.length}/${MAX_DETAILS}`}
            FormHelperTextProps={{ sx: { textAlign: "right" } }}
            multiline
            minRows={3}
            fullWidth
            sx={{ mt: 3 }}
          />
        </DialogContent>
        <DialogActions sx={{ mt: "auto", px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSending} disabled={!kind || !name.trim()}>
            Send request
          </LoadingButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default RequestGameDialog;
