import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup, Stack } from "@mui/material";

import FriendPicker from "@/components/FriendPicker";

const CHOICES = [
  { value: "all", label: "All friends" },
  { value: "except", label: "All friends except…" },
  { value: "only", label: "Only share with…" },
];

const choiceOf = (audience) => {
  if (audience.only) return "only";
  return audience.except.length ? "except" : "all";
};

export const audienceLabelOf = (audience) => {
  if (audience.only) return `Only ${audience.only.length} ${audience.only.length === 1 ? "friend" : "friends"}`;
  return audience.except.length ? `All friends except ${audience.except.length}` : "All friends";
};

const sameAudience = (one, other) => {
  const [mode] = Object.keys(one);
  return mode in other && [...one[mode]].sort().join() === [...other[mode]].sort().join();
};

// each choice keeps its own ticks, so moving between them never turns the people left out into the only ones
const AudienceDialog = ({ audience, onSave, onClose }) => {
  const [choice, setChoice] = useState(() => choiceOf(audience));
  const [ticked, setTicked] = useState(() => ({ except: audience.except ?? [], only: audience.only ?? [] }));

  // Done without a change keeps whatever applied before, so Settings still apply even if they had not loaded yet
  const save = () => {
    const chosen = choice === "only" ? { only: ticked.only } : { except: choice === "except" ? ticked.except : [] };
    if (!sameAudience(chosen, audience)) onSave(chosen);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="audience-title">
      <DialogTitle id="audience-title">Who can see this update</DialogTitle>
      <DialogContent>
        <RadioGroup aria-labelledby="audience-title" value={choice} onChange={(event) => setChoice(event.target.value)}>
          {CHOICES.map(({ value, label }) => (
            <FormControlLabel key={value} value={value} control={<Radio />} label={label} />
          ))}
        </RadioGroup>
        {choice !== "all" && (
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            <FriendPicker selected={ticked[choice]} onChange={(ids) => setTicked((current) => ({ ...current, [choice]: ids }))} emptyLabel="You have no friends to choose from yet" />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={choice === "only" && !ticked.only.length}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AudienceDialog;
