import { useState } from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { SendRequest } from "@/redux/slices/actions/contactActions";

const NOTE_LIMIT = 200;
const COUNT_FROM = 160;

// code points rather than UTF-16 units, so most emoji count once
const lengthOf = (text) => [...text].length;

const RequestComposer = ({ person, onSent, onCancel }) => {
  const dispatch = useDispatch();
  const isSending = useIsLoading(SendRequest);
  const canSeal = useSelector((state) => state.encryption.status === "ready");
  const [text, setText] = useState("");
  const length = lengthOf(text);

  const send = async (event) => {
    event.preventDefault();
    if (isSending) return;
    const result = await dispatch(SendRequest({ userId: person._id, text }));
    if (SendRequest.fulfilled.match(result)) onSent?.();
  };

  const sendOnShortcut = (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(event);
  };

  return (
    <Stack component="form" onSubmit={send} spacing={1.5}>
      <TextField
        label="Add a message (optional)"
        placeholder="Say who you are or how you know each other"
        value={text}
        onChange={(event) => setText([...event.target.value].slice(0, NOTE_LIMIT).join(""))}
        onKeyDown={sendOnShortcut}
        disabled={!canSeal}
        helperText={canSeal ? `Text only. ${person.firstName} sees it with your request.` : "Unlock your messages to add a note"}
        multiline
        minRows={3}
        fullWidth
        autoFocus
      />
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography aria-live="polite" sx={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
          {length >= COUNT_FROM && `${length} / ${NOTE_LIMIT}`}
        </Typography>
        {onCancel && (
          <Button color="inherit" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={isSending}>
          Send request
        </Button>
      </Stack>
    </Stack>
  );
};

export default RequestComposer;
