import { Box, Stack, Typography } from "@mui/material";

import PersonActions from "@/sections/admin/PersonActions";
import PersonStatus from "@/sections/admin/PersonStatus";
import getAvatar from "@/utils/avatars";

const PersonRow = ({ person, onChanged }) => (
  <Stack component="li" direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ py: 2, borderTop: 1, borderColor: "divider" }}>
    <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
      {getAvatar(person.avatar, `${person.firstName} ${person.lastName}`, 40)}
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{`${person.firstName} ${person.lastName}`}</Typography>
          <PersonStatus person={person} />
        </Stack>
        <Typography sx={{ fontSize: 13, color: "text.secondary", overflowWrap: "anywhere" }}>
          {person.username ? `@${person.username} · ${person.email}` : person.email}
        </Typography>
      </Box>
    </Stack>
    <Box sx={{ flexShrink: 0 }}>
      <PersonActions person={person} onDone={onChanged} />
    </Box>
  </Stack>
);

export default PersonRow;
