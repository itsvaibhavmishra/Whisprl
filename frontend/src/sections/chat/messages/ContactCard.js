import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch } from "react-redux";

import RequestButton from "@/components/profile/RequestButton";
import useRelationship from "@/hooks/useRelationship";
import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import getAvatar from "@/utils/avatars";

const ContactCard = ({ contact, isMine }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { state } = useRelationship(contact._id);

  const fullName = `${contact.firstName} ${contact.lastName}`;
  const actionSx = {
    color: "inherit",
    bgcolor: isMine ? alpha("#fff", 0.18) : alpha(theme.palette.primary.main, 0.12),
    "&:hover": { bgcolor: isMine ? alpha("#fff", 0.28) : alpha(theme.palette.primary.main, 0.2) },
  };

  return (
    <Stack spacing={1.25} sx={{ minWidth: 200, p: 0.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {getAvatar(contact.avatar, contact.firstName, 40)}
        <Box sx={{ minWidth: 0 }}>
          <Typography data-searchable variant="subtitle2" noWrap>
            {fullName}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>
            {contact.username ? `@${contact.username}` : "Contact"}
          </Typography>
        </Box>
      </Stack>
      {state === "friend" ? (
        <Button
          size="small"
          fullWidth
          onClick={(event) => {
            event.stopPropagation();
            dispatch(CreateOpenConversation(contact._id));
          }}
          sx={actionSx}
        >
          Message
        </Button>
      ) : (
        <RequestButton person={contact} size="small" fullWidth variant="text" sx={actionSx} />
      )}
    </Stack>
  );
};

export default ContactCard;
