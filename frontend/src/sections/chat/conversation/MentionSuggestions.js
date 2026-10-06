import { List, ListItemAvatar, ListItemButton, ListItemText, Paper, Popper, useTheme } from "@mui/material";

import getAvatar from "@/utils/createAvatar";

const MentionSuggestions = ({ anchorEl, people, activeIndex, onPick }) => {
  const theme = useTheme();

  return (
    <Popper open={Boolean(anchorEl) && people.length > 0} anchorEl={anchorEl} placement="top-start" sx={{ zIndex: "modal" }}>
      <Paper elevation={8} sx={{ mb: 1, minWidth: 240 }}>
        <List dense role="listbox" aria-label="Mention someone">
          {people.map((person, index) => (
            <ListItemButton
              key={person._id}
              role="option"
              aria-selected={index === activeIndex}
              selected={index === activeIndex}
              onMouseDown={(event) => {
                event.preventDefault();
                onPick(person);
              }}
            >
              <ListItemAvatar sx={{ minWidth: 40 }}>{getAvatar(person.avatar, person.firstName, theme, 28)}</ListItemAvatar>
              <ListItemText primary={`${person.firstName} ${person.lastName}`} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Popper>
  );
};

export default MentionSuggestions;
