import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { GetBlocked, UnblockUser } from "@/redux/slices/actions/chatSettingsActions";
import { SettingRow } from "@/sections/settings/SettingsSection";
import getAvatar from "@/utils/createAvatar";

const countOf = (people) => {
  if (!people.length) return "Nobody. Block someone from their chat details.";
  return people.length === 1 ? "1 person" : `${people.length} people`;
};

const BlockedPeopleSetting = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const blockedPeople = useSelector((state) => state.user.blockedPeople);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(GetBlocked());
  }, [dispatch]);

  return (
    <SettingRow label="Blocked people" description={countOf(blockedPeople)}>
      {blockedPeople.length > 0 && (
        <Button variant="outlined" color="inherit" onClick={() => setIsOpen(true)}>
          Manage
        </Button>
      )}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="xs" aria-labelledby="blocked-title">
        <DialogTitle id="blocked-title">Blocked people</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            They can't message you or see when you're online.
          </Typography>
          <List disablePadding>
            {blockedPeople.map((person) => (
              <ListItem
                key={person._id}
                disableGutters
                secondaryAction={
                  <Button size="small" onClick={() => dispatch(UnblockUser(person._id))}>
                    Unblock
                  </Button>
                }
              >
                <ListItemAvatar>{getAvatar(person.avatar, person.firstName, theme, 36)}</ListItemAvatar>
                <ListItemText
                  primary={`${person.firstName} ${person.lastName}`}
                  secondary={person.username && `@${person.username}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </SettingRow>
  );
};

export default BlockedPeopleSetting;
