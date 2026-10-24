import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import useIsLoading from "@/hooks/useIsLoading";
import { BanPerson, RestorePerson, SuspendPerson } from "@/redux/slices/actions/adminActions";
import { statusOf } from "@/sections/admin/PersonStatus";
import { can, isStaff } from "@/utils/roles";

const SUSPEND_DAYS = [1, 7, 30];

const ACTIONS = {
  suspend: {
    thunk: SuspendPerson,
    title: (name) => `Suspend ${name}?`,
    explanation: "They can't log in until the suspension ends, and their open sessions close now.",
    verb: "Suspend",
    needsLength: true,
  },
  ban: {
    thunk: BanPerson,
    title: (name) => `Ban ${name}?`,
    explanation: "They can't log in again, their open sessions close now, and everyone else sees “Whisprl user” in their place.",
    verb: "Ban",
    isDanger: true,
  },
  restore: {
    thunk: RestorePerson,
    title: (name) => `Give ${name} access back?`,
    explanation: "They can log in again, and their name and photo come back for everyone else.",
    verb: "Give access back",
  },
};

const ActionDialog = ({ action, person, reportId, onClose, onDone }) => {
  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(SUSPEND_DAYS[1]);
  const isWorking = useIsLoading(action.thunk);

  const act = async () => {
    const details = { userId: person._id, reason, reportId, ...(action.needsLength && { until: dayjs().add(days, "day").toISOString() }) };
    const result = await dispatch(action.thunk(details));
    if (!action.thunk.fulfilled.match(result)) return;
    onClose();
    onDone();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{action.title(`${person.firstName} ${person.lastName}`)}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14.5 }}>{action.explanation}</DialogContentText>
        {action.needsLength && (
          <TextField
            select
            fullWidth
            label="For how long"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            sx={{ mt: 2.5 }}
            slotProps={{ select: { native: true } }}
          >
            {SUSPEND_DAYS.map((count) => (
              <option key={count} value={count}>
                {count === 1 ? "1 day" : `${count} days`}
              </option>
            ))}
          </TextField>
        )}
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Why"
          placeholder="They get this by email, and it goes in the audit log"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          sx={{ mt: 2.5 }}
        />
        <DialogContentText sx={{ mt: 2, fontSize: 13 }}>Your passkey is asked for next.</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" color={action.isDanger ? "error" : "primary"} loading={isWorking} disabled={!reason.trim()} onClick={act}>
          {action.verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PersonActions = ({ person, reportId, onDone }) => {
  const user = useSelector((state) => state.user.user);
  const [kind, setKind] = useState(null);
  const status = statusOf(person);
  if (isStaff(person.role)) return null;

  const isShutOut = status === "banned" || status === "suspended";

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {isShutOut && can(user, status === "banned" ? "ban" : "suspend") && (
          <Button size="small" variant="outlined" color="inherit" onClick={() => setKind("restore")}>
            Give access back
          </Button>
        )}
        {!isShutOut && can(user, "suspend") && (
          <Button size="small" variant="outlined" color="inherit" onClick={() => setKind("suspend")}>
            Suspend
          </Button>
        )}
        {status !== "banned" && can(user, "ban") && (
          <Button size="small" variant="outlined" color="error" onClick={() => setKind("ban")}>
            Ban
          </Button>
        )}
      </Stack>

      {kind && <ActionDialog action={ACTIONS[kind]} person={person} reportId={reportId} onClose={() => setKind(null)} onDone={onDone} />}
    </>
  );
};

export default PersonActions;
