import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup, Stack } from "@mui/material";

import FriendPicker from "@/components/FriendPicker";

const CHOICES = [
  { value: "all", label: "All friends" },
  { value: "except", label: "All friends except…" },
  { value: "only", label: "Only share with…" },
  { value: "everyone", label: "Everyone on Whisprl" },
];

const choiceOf = (audience) => {
  if (audience.everyone) return "everyone";
  if (audience.only) return "only";
  return audience.except.length ? "except" : "all";
};

export const audienceLabelOf = (audience) => {
  if (audience.everyone) return "Everyone on Whisprl";
  if (audience.only) return `Only ${audience.only.length} ${audience.only.length === 1 ? "friend" : "friends"}`;
  return audience.except.length ? `All friends except ${audience.except.length}` : "All friends";
};

const audienceFrom = (choice, ticked) => {
  if (choice === "everyone") return { everyone: true };
  if (choice === "only") return { only: ticked.only };
  return { except: choice === "except" ? ticked.except : [] };
};

const idsOf = (audience, mode) => [...(audience[mode] ?? [])].sort().join();

const sameAudience = (one, other) => {
  const [mode] = Object.keys(one);
  return mode in other && (mode === "everyone" || idsOf(one, mode) === idsOf(other, mode));
};

// each choice keeps its own ticks, so moving between them never turns the people left out into the only ones
const AudienceDialog = ({ audience, onSave, onClose }) => {
  const [openedWith] = useState(audience);
  const [choice, setChoice] = useState(() => choiceOf(openedWith));
  const [ticked, setTicked] = useState(() => ({ except: openedWith.except ?? [], only: openedWith.only ?? [] }));

  // Done without a change keeps whatever applied before, so Settings still apply even if they load while this is open
  const save = () => {
    const chosen = audienceFrom(choice, ticked);
    if (!sameAudience(chosen, openedWith)) onSave(chosen);
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
        {["except", "only"].includes(choice) && (
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
