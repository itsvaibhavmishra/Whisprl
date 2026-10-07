import { useState } from "react";
import { Box, IconButton, ListItem, ListItemAvatar, ListItemText, Menu, MenuItem } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DotsThreeVertical } from "phosphor-react";
import { useDispatch } from "react-redux";

import { RemoveGroupMember, SetGroupAdmin } from "@/redux/slices/actions/groupActions";
import ChatAvatar from "@/sections/chat/ChatAvatar";
import { isAdminOf, isOwnerOf, mayRemove, roleOf } from "@/utils/groups";

const GroupMemberRow = ({ group, member, meId }) => {
  const dispatch = useDispatch();
  const [anchor, setAnchor] = useState(null);

  const isMe = member._id === meId;
  const isAdmin = isAdminOf(group, member._id);
  const role = roleOf(group, member._id);
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
      sx={{ pl: 1.5, minHeight: 56 }}
      secondaryAction={
        actions.length > 0 && (
          <IconButton aria-label={`Options for ${member.firstName}`} onClick={(event) => setAnchor(event.currentTarget)}>
            <DotsThreeVertical />
          </IconButton>
        )
      }
    >
      <ListItemAvatar sx={{ minWidth: 0, mr: 1.5 }}>
        <ChatAvatar src={member.avatar} name={member.firstName} size={40} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <>
            {isMe ? "You" : `${member.firstName} ${member.lastName}`}
            {role && (
              <Box
                component="span"
                sx={{ ml: 1, px: 0.75, py: 0.25, borderRadius: 99, fontSize: 11, fontWeight: 700, verticalAlign: "1px", color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }}
              >
                {role}
              </Box>
            )}
          </>
        }
        primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
      />

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
