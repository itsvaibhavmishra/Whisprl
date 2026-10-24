import { useState } from "react";
import { Button, InputAdornment, TextField } from "@mui/material";
import { useSelector } from "react-redux";

import UsernameDialog, { nextChangeOn } from "@/components/UsernameDialog";

const UsernameField = () => {
  const { username, usernameChangedAt } = useSelector((state) => state.user.user);
  const [isChanging, setIsChanging] = useState(false);
  const lockedUntil = nextChangeOn(usernameChangedAt);

  const helperText = lockedUntil
    ? `You can change it again on ${lockedUntil.toLocaleDateString(undefined, { day: "numeric", month: "long" })}.`
    : "People can find you by it. You can change it once every 30 days.";

  return (
    <>
      <TextField
        fullWidth
        sx={{ mt: 1 }}
        label="Username"
        value={username ? `@${username}` : ""}
        helperText={helperText}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <Button size="small" onClick={() => setIsChanging(true)} disabled={!username || Boolean(lockedUntil)}>
                Change
              </Button>
            </InputAdornment>
          ),
        }}
      />
      {isChanging && <UsernameDialog current={username} onClose={() => setIsChanging(false)} />}
    </>
  );
};

export default UsernameField;
