import { useState } from "react";
import { List, ListItemAvatar, ListItemButton, ListItemText, Stack, TextField, Typography } from "@mui/material";

import getAvatar from "@/utils/avatars";

const fullNameOf = (person) => `${person.firstName} ${person.lastName}`;

const MentionPicker = ({ people, onPick }) => {
  const [query, setQuery] = useState("");
  const wanted = query.trim().toLowerCase();
  const matches = people.filter((person) => `${fullNameOf(person)} ${person.username}`.toLowerCase().includes(wanted));

  return (
    <Stack spacing={1} sx={{ p: 2, width: { xs: "100%", md: 360 }, maxWidth: 420 }}>
      <TextField size="small" label="Search friends" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus fullWidth />
      <List dense sx={{ maxHeight: 360, overflowY: "auto" }}>
        {matches.map((person) => (
          <ListItemButton key={person._id} onClick={() => onPick({ kind: "mention", userId: person._id, username: person.username })}>
            <ListItemAvatar>{getAvatar(person.avatar, person.firstName, 36)}</ListItemAvatar>
            <ListItemText primary={fullNameOf(person)} secondary={`@${person.username}`} />
          </ListItemButton>
        ))}
      </List>
      {!matches.length && <Typography sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>No friends match that name</Typography>}
    </Stack>
  );
};

export default MentionPicker;
