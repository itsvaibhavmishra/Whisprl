import { useState } from "react";
import { Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChatCircleDots, PencilSimple, ShareNetwork, UserPlus } from "phosphor-react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import RequestComposer from "@/components/profile/RequestComposer";
import RequestNote from "@/components/profile/RequestNote";
import useIsLoading from "@/hooks/useIsLoading";
import useOpenChat from "@/hooks/useOpenChat";
import { AcceptRejectRequest, CancelRequest, DeclineRequest } from "@/redux/slices/actions/contactActions";
import { PATH_DASHBOARD } from "@/routes/paths";
import { shareProfile } from "@/sections/contacts/contactsRoute";
import { waitLabel } from "@/utils/relationship";

// tinted from the text rather than filled, so it shows on the white list and the grey canvas alike
export const SOFT = {
  color: "text.primary",
  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.08),
  "&:hover": { bgcolor: (theme) => alpha(theme.palette.text.primary, 0.14) },
};

const ShareButton = ({ person }) => (
  <Tooltip title="Share profile">
    <IconButton aria-label="Share profile" onClick={() => shareProfile(person)} sx={{ ...SOFT, width: 40, height: 40 }}>
      <ShareNetwork size={18} weight="bold" />
    </IconButton>
  </Tooltip>
);

const Helper = ({ children }) => <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>{children}</Typography>;

const RelationshipActions = ({ person, relationship, startWithComposer = false }) => {
  const dispatch = useDispatch();
  const message = useOpenChat(person._id);
  const [isComposing, setIsComposing] = useState(startWithComposer);
  const isAnswering = useIsLoading(AcceptRejectRequest);
  const isCancelling = useIsLoading(CancelRequest, person._id);
  const { firstName } = person;
  const { request } = relationship;


  switch (relationship.state) {
    case "self":
      return (
        <Stack direction="row" spacing={1}>
          <Button component={Link} to={PATH_DASHBOARD.general.profile} variant="contained" startIcon={<PencilSimple weight="bold" />}>
            Edit profile
          </Button>
          <ShareButton person={person} />
        </Stack>
      );
    case "friend":
      return (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<ChatCircleDots weight="bold" />} onClick={message}>
            Message
          </Button>
          <ShareButton person={person} />
        </Stack>
      );
    case "incoming":
      return (
        <Stack spacing={1.5}>
          <RequestNote request={request} isMine={false} />
          {request.note && <Helper>{firstName} can't see that you've read this until you accept.</Helper>}
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={isAnswering} onClick={() => dispatch(AcceptRejectRequest({ sender_id: person._id, type: "accept" }))}>
              Accept
            </Button>
            <Button disabled={isAnswering} onClick={() => dispatch(DeclineRequest(person))} sx={SOFT}>
              Decline
            </Button>
          </Stack>
        </Stack>
      );
    case "outgoing":
      return (
        <Stack spacing={1.5}>
          <RequestNote request={request} isMine />
          {request.note && <Helper>Read receipts start once {firstName} accepts.</Helper>}
          <Button disabled={isCancelling} onClick={() => dispatch(CancelRequest(person._id))} sx={{ ...SOFT, alignSelf: "start" }}>
            Cancel request
          </Button>
        </Stack>
      );
    case "cooldown":
      return (
        <Button disabled sx={{ ...SOFT, alignSelf: "start" }}>
          {waitLabel(relationship.until)}
        </Button>
      );
    case "blocked":
      return <Helper>You blocked {firstName}. Unblock them to message or send a request.</Helper>;
    default:
      return isComposing ? (
        <RequestComposer person={person} onSent={() => setIsComposing(false)} onCancel={() => setIsComposing(false)} />
      ) : (
        <Button variant="contained" startIcon={<UserPlus weight="bold" />} onClick={() => setIsComposing(true)} sx={{ alignSelf: "start" }}>
          Add friend
        </Button>
      );
  }
};

export default RelationshipActions;
