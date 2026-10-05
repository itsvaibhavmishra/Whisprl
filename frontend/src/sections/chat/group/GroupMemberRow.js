import { useState } from "react";
import { IconButton, ListItem, ListItemAvatar, ListItemText, Menu, MenuItem, useTheme } from "@mui/material";
import { DotsThreeVertical } from "phosphor-react";
import { useDispatch } from "react-redux";

import { RemoveGroupMember, SetGroupAdmin } from "@/redux/slices/actions/groupActions";
import getAvatar from "@/utils/createAvatar";
import { isAdminOf, isOwnerOf, mayRemove, roleOf } from "@/utils/groups";

const GroupMemberRow = ({ group, member, meId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [anchor, setAnchor] = useState(null);

  const isMe = member._id === meId;
  const isAdmin = isAdminOf(group, member._id);
  const target = { groupId: group._id, userId: member._id };

  const actions = [
    isOwnerOf(group, meId) &&
      !isMe && {
        label: isAdmin ? "Remove as admin" : "Make admin",
        action: SetGroupAdmin({ ...target, makeAdmin: !isAdmin }),
      },
    mayRemove(group, meId, member._id) && { label: "Remove from group", action: RemoveGroupMember(target), isDanger: true },
  ].filter(Boolean);

  const run = (action) => {
    setAnchor(null);
    dispatch(action);
  };

  return (
    <ListItem
      secondaryAction={
        actions.length > 0 && (
          <IconButton aria-label={`Options for ${member.firstName}`} onClick={(event) => setAnchor(event.currentTarget)}>
            <DotsThreeVertical />
          </IconButton>
        )
      }
    >
      <ListItemAvatar>{getAvatar(member.avatar, member.firstName, theme, 36)}</ListItemAvatar>
      <ListItemText primary={isMe ? "You" : `${member.firstName} ${member.lastName}`} secondary={roleOf(group, member._id)} />

      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {actions.map(({ label, action, isDanger }) => (
          <MenuItem key={label} onClick={() => run(action)} sx={isDanger ? { color: "error.main" } : undefined}>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </ListItem>
  );
};

export default GroupMemberRow;
