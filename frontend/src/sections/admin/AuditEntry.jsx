import { Box, Stack, Typography } from "@mui/material";
import { ScrollIcon } from "@phosphor-icons/react";

import useSettings from "@/hooks/useSettings";
import getAvatar from "@/utils/avatars";
import { formatClock } from "@/utils/formatMessageTime";
import { permissionLabel } from "@/utils/roles";

export const NODE_SIZE = 32;

const nameOf = (person) => (person ? `${person.firstName} ${person.lastName}` : "A deleted account");

const Person = ({ label, person }) => (
  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
    {getAvatar(person?.avatar, nameOf(person), 20)}
    <Typography component="span" sx={{ fontSize: 13, fontWeight: 600 }}>{`${label} ${nameOf(person)}`}</Typography>
  </Stack>
);

const AuditEntry = ({ entry }) => {
  const { use24Hour } = useSettings();

  return (
    <Stack component="li" direction="row" spacing={2} sx={{ py: 1.5 }}>
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: NODE_SIZE,
          height: NODE_SIZE,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color: "primary.main",
          bgcolor: "background.default",
          boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`,
        }}
      >
        <ScrollIcon size={16} weight="fill" aria-hidden />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "baseline" }}>
          <Typography sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.45 }}>{entry.action.replaceAll("_", " ")}</Typography>
          <Typography
            component="time"
            dateTime={entry.createdAt}
            sx={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {formatClock(entry.createdAt, use24Hour)}
          </Typography>
        </Stack>

        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
          <Person label="By" person={entry.actor} />
          {entry.target && <Person label="To" person={entry.target} />}
        </Stack>

        {entry.permissions && (
          <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary" }}>{`Can use ${entry.permissions.map(permissionLabel).join(", ")}`}</Typography>
        )}

        {entry.reason && (
          <Typography
            component="blockquote"
            sx={{ m: 0, mt: 1.25, pl: 1.5, py: 0.25, borderLeft: 3, borderColor: "primary.main", fontSize: 14, lineHeight: 1.5, overflowWrap: "anywhere" }}
          >
            {entry.reason}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default AuditEntry;
