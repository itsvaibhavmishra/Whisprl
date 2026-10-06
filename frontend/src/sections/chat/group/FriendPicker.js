import { useEffect, useState } from "react";
import {
  Checkbox,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { GetFriends } from "@/redux/slices/actions/userActions";
import useIsLoading from "@/hooks/useIsLoading";
import getAvatar from "@/utils/createAvatar";

const fullNameOf = (friend) => `${friend.firstName} ${friend.lastName}`;

// a friend without keys could not open a single message, so they cannot be added yet
const hasKeys = (friend) => friend.publicKeys?.length > 0;

const FriendPicker = ({ excludeIds = [], selected, onChange, requireKeys = true }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { friends, user } = useSelector((state) => state.user);
  const isLoading = useIsLoading(GetFriends);
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(GetFriends());
  }, [dispatch]);

  const toggle = (friendId) =>
    onChange(selected.includes(friendId) ? selected.filter((id) => id !== friendId) : [...selected, friendId]);

  const choosable = friends
    .filter((friend) => friend._id !== user._id && !excludeIds.includes(friend._id))
    .filter((friend) => fullNameOf(friend).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <TextField
        size="small"
        label="Search friends"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        fullWidth
      />
      {isLoading && !friends.length ? (
        <CircularProgress size={24} sx={{ alignSelf: "center", my: 2 }} aria-label="Loading friends" />
      ) : !choosable.length ? (
        <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
          {query ? "No friends match that name" : "No friends left to add"}
        </Typography>
      ) : (
        <List dense sx={{ maxHeight: 280, overflowY: "auto" }} className="scrollbar">
          {choosable.map((friend) => (
            <ListItem key={friend._id} disablePadding>
              <ListItemButton onClick={() => toggle(friend._id)} disabled={requireKeys && !hasKeys(friend)}>
                <ListItemAvatar>{getAvatar(friend.avatar, friend.firstName, theme, 36)}</ListItemAvatar>
                <ListItemText
                  primary={fullNameOf(friend)}
                  secondary={!requireKeys || hasKeys(friend) ? null : "Has not opened Whisprl since encryption arrived"}
                />
                <Checkbox
                  edge="end"
                  checked={selected.includes(friend._id)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-label": `Choose ${fullNameOf(friend)}` }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
};

export default FriendPicker;
