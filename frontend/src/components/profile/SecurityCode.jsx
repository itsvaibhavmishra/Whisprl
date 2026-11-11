import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { ShieldCheckIcon, ShieldWarningIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import ControlRow from "@/components/ControlRow";
import useSafetyNumber from "@/hooks/useSafetyNumber";
import { SetVerified } from "@/redux/slices/actions/encryptionActions";

const statusOf = (verifiedKeyId, keyId) => {
  if (!verifiedKeyId) return "unchecked";
  return verifiedKeyId === keyId ? "verified" : "changed";
};

const ROW = {
  unchecked: { icon: ShieldCheckIcon, label: "Verify security code", detail: () => "Check your messages are end-to-end encrypted" },
  verified: { icon: ShieldCheckIcon, label: "Security code verified", detail: (name) => `You checked it with ${name}` },
  changed: { icon: ShieldWarningIcon, label: "Security code changed", detail: (name) => `Check it with ${name} again`, isDanger: true },
};

export const SecurityCodeDialog = ({ person, onClose }) => {
  const dispatch = useDispatch();
  const { digits, keyId } = useSafetyNumber(person);
  const verifiedKeyId = useSelector((state) => state.encryption.verified[person._id]);
  const status = statusOf(verifiedKeyId, keyId);
  const { firstName } = person;

  return (
    <Dialog open fullWidth maxWidth="xs" onClose={onClose} aria-labelledby="security-code-title" slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle id="security-code-title" sx={{ pb: 0.5 }}>
        Security code with {firstName}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
          Compare these numbers with the ones {firstName} sees, in person or on a call. If they match, nobody else can read the messages between you.
        </Typography>
        {status === "changed" && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {firstName}&apos;s security code changed since you verified it. That happens when someone starts fresh with new encryption keys, but it could also
            mean someone is trying to read your messages.
          </Alert>
        )}
        <Box
          aria-label={digits ? `Security code ${digits.join(" ")}` : "Working out the security code"}
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: "background.neutral",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            rowGap: 1.25,
            textAlign: "center",
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "0.06em",
            fontVariantNumeric: "tabular-nums",
            minHeight: 140,
          }}
        >
          {(digits ?? Array(12).fill("·····")).map((group, index) => (
            <span key={index} style={{ opacity: digits ? 1 : 0.3 }}>
              {group}
            </span>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {status !== "unchecked" && (
          <Button color="inherit" onClick={() => dispatch(SetVerified({ personId: person._id, keyId: null }))}>
            Clear verification
          </Button>
        )}
        {status === "verified" ? (
          <Button variant="contained" onClick={onClose}>
            Done
          </Button>
        ) : (
          <Button variant="contained" disabled={!digits} onClick={() => dispatch(SetVerified({ personId: person._id, keyId })).then(onClose)}>
            Mark as verified
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const SecurityCode = ({ person }) => {
  const { keyId } = useSafetyNumber(person);
  const verifiedKeyId = useSelector((state) => state.encryption.verified[person._id]);
  const [isOpen, setIsOpen] = useState(false);
  if (!keyId) return null;
  const row = ROW[statusOf(verifiedKeyId, keyId)];

  return (
    <>
      <ControlRow icon={row.icon} label={row.label} detail={row.detail(person.firstName)} isDanger={row.isDanger} onClick={() => setIsOpen(true)} />
      {isOpen && <SecurityCodeDialog person={person} onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default SecurityCode;
