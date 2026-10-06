import { useState } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";

import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import { SendRequest } from "@/redux/slices/actions/contactActions";
import getAvatar from "@/utils/createAvatar";

const ContactCard = ({ contact, isMine }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, friends } = useSelector((state) => state.user);
  const [isRequested, setIsRequested] = useState(false);

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const isFriend = friends.some((friend) => friend._id === contact._id);

  const addFriend = async () => {
    const result = await dispatch(SendRequest(contact._id));
    if (SendRequest.fulfilled.match(result)) setIsRequested(true);
  };

  const actionFor = () => {
    if (contact._id === user._id) return null;
    if (isFriend) return { label: "Message", onClick: () => dispatch(CreateOpenConversation(contact._id)) };
    return { label: isRequested ? "Request sent" : "Add friend", onClick: addFriend, disabled: isRequested };
  };
  const action = actionFor();

  return (
    <Stack spacing={1.25} sx={{ minWidth: 200, p: 0.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {getAvatar(contact.avatar, contact.firstName, theme, 40)}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {fullName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            Contact
          </Typography>
        </Box>
      </Stack>
      {action && (
        <Button
          size="small"
          fullWidth
          disabled={action.disabled}
          onClick={(event) => {
            event.stopPropagation();
            action.onClick();
          }}
          sx={{
            color: "inherit",
            bgcolor: isMine ? alpha("#fff", 0.18) : alpha(theme.palette.primary.main, 0.12),
            "&:hover": { bgcolor: isMine ? alpha("#fff", 0.28) : alpha(theme.palette.primary.main, 0.2) },
          }}
        >
          {action.label}
        </Button>
      )}
    </Stack>
  );
};

export default ContactCard;
