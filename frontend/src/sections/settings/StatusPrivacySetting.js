import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetHiddenFrom, SetHiddenFrom } from "@/redux/slices/actions/statusActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { SettingRow } from "@/sections/settings/SettingsSection";
import getAvatar from "@/utils/createAvatar";

const summaryOf = (hiddenCount) => {
  if (!hiddenCount) return "All your friends.";
  return `All your friends except ${hiddenCount === 1 ? "1 person" : `${hiddenCount} people`}.`;
};

const HiddenFromDialog = ({ onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const friends = useSelector((state) => state.user.friends).filter((friend) => friend._id !== meId);
  const savedIds = useSelector((state) => state.status.hiddenFrom);
  const isSaving = useIsLoading(SetHiddenFrom);
  const [hiddenIds, setHiddenIds] = useState(() => new Set(savedIds));

  useEffect(() => {
    dispatch(GetFriends());
  }, [dispatch]);

  const toggle = (friendId) =>
    setHiddenIds((current) => {
      const next = new Set(current);
      if (!next.delete(friendId)) next.add(friendId);
      return next;
    });

  const save = async () => {
    const result = await dispatch(SetHiddenFrom([...hiddenIds]));
    if (!result.error) onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="hidden-from-title">
      <DialogTitle id="hidden-from-title">Hide my status from</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          The people you tick won't see the updates you share from now on.
        </Typography>
        {!friends.length && (
          <Typography variant="body2" sx={{ py: 2 }}>
            Add friends in Contacts to choose from them here.
          </Typography>
        )}
        <List disablePadding>
          {friends.map((friend) => (
            <ListItem key={friend._id} disablePadding>
              <ListItemButton onClick={() => toggle(friend._id)} sx={{ px: 0, borderRadius: 2 }}>
                <ListItemAvatar>{getAvatar(friend.avatar, friend.firstName, theme, 36)}</ListItemAvatar>
                <ListItemText primary={`${friend.firstName} ${friend.lastName}`} secondary={friend.username && `@${friend.username}`} />
                <Checkbox
                  edge="end"
                  checked={hiddenIds.has(friend._id)}
                  tabIndex={-1}
                  inputProps={{ "aria-label": `Hide from ${friend.firstName} ${friend.lastName}` }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={isSaving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StatusPrivacySetting = () => {
  const dispatch = useDispatch();
  const hiddenFrom = useSelector((state) => state.status.hiddenFrom);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(GetHiddenFrom());
  }, [dispatch]);

  return (
    <SettingRow label="Who sees my status" description={summaryOf(hiddenFrom.length)}>
      <Button variant="outlined" color="inherit" onClick={() => setIsOpen(true)}>
        Choose
      </Button>
      {isOpen && <HiddenFromDialog onClose={() => setIsOpen(false)} />}
    </SettingRow>
  );
};

export default StatusPrivacySetting;
