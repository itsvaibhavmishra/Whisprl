import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import { AnimatePresence, m } from "framer-motion";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Pane, { PaneEmpty, PaneSection, READING_WIDTH } from "@/components/Pane";
import RelationshipActions from "@/components/profile/RelationshipActions";
import useHasSettled from "@/hooks/useHasSettled";
import { GetRequests } from "@/redux/slices/actions/contactActions";
import ChatAvatar from "@/sections/chat/ChatAvatar";
import { FIND_PATH, contactPathOf } from "@/sections/contacts/contactsRoute";
import { ageOf } from "@/utils/statuses";

const DAY_MS = 24 * 60 * 60 * 1000;
const COLLAPSE = { duration: 0.2, ease: [0.33, 1, 0.68, 1] };

// a request can wait for weeks, so past a day it counts days and then shows its date
const sinceOf = (time) => {
  const days = Math.floor((Date.now() - new Date(time).getTime()) / DAY_MS);
  if (days < 1) return ageOf(time);
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const RequestItem = ({ request, isMine }) => {
  const { person } = request;
  const name = `${person.firstName} ${person.lastName}`;

  return (
    <Box
      component={m.article}
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={COLLAPSE}
      aria-label={name}
      sx={{ display: "flex", gap: 1.5, py: 2, overflow: "hidden" }}
    >
      <ButtonBase component={Link} to={contactPathOf(person)} aria-label={`View ${name}'s profile`} sx={{ alignSelf: "start", borderRadius: "50%" }}>
        <ChatAvatar src={person.avatar} name={person.firstName} size={48} />
      </ButtonBase>
      <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Box>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography component={Link} to={contactPathOf(person)} noWrap sx={{ minWidth: 0, fontSize: 15, fontWeight: 700, color: "text.primary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              {name}
            </Typography>
            <Typography component="time" dateTime={request.createdAt} sx={{ flexShrink: 0, fontSize: 12.5, fontWeight: 500, color: "text.secondary" }}>
              {isMine ? `Sent ${sinceOf(request.createdAt).toLowerCase()}` : sinceOf(request.createdAt)}
            </Typography>
          </Stack>
          {person.username && <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>@{person.username}</Typography>}
        </Box>
        <RelationshipActions person={person} relationship={{ state: isMine ? "outgoing" : "incoming", request }} />
      </Stack>
    </Box>
  );
};

const RequestGroup = ({ label, requests, isMine }) => (
  <PaneSection label={label} count={requests.length}>
    <AnimatePresence initial={false}>
      {requests.map((request) => (
        <RequestItem key={request._id} request={request} isMine={isMine} />
      ))}
    </AnimatePresence>
  </PaneSection>
);

const RequestsView = ({ onBack }) => {
  const incoming = useSelector((state) => state.contact.incoming);
  const outgoing = useSelector((state) => state.contact.outgoing);
  const hasRequests = useHasSettled(GetRequests);
  const isEmpty = !incoming.length && !outgoing.length;

  return (
    <Pane title="Requests" subtitle="People who want to be your friend, with their first message, and the requests you've sent." onBack={onBack} width={READING_WIDTH}>
      {hasRequests && isEmpty && (
        <PaneEmpty text="No requests right now. When someone asks to be your friend, their request and message show here.">
          <Button component={Link} to={FIND_PATH} variant="contained">
            Find people
          </Button>
        </PaneEmpty>
      )}
      <Stack spacing={4}>
        {incoming.length > 0 && <RequestGroup label="Received" requests={incoming} isMine={false} />}
        {outgoing.length > 0 && <RequestGroup label="Sent" requests={outgoing} isMine />}
      </Stack>
    </Pane>
  );
};

export default RequestsView;
