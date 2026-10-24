import { Box, Stack, Typography } from "@mui/material";
import { UsersThree } from "phosphor-react";

import getAvatar from "@/utils/avatars";

const Sealed = ({ children }) => <Typography sx={{ fontSize: 13.5, fontStyle: "italic", color: "text.secondary" }}>{children}</Typography>;

const Frame = ({ children }) => <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}>{children}</Box>;

const StatusEvidence = ({ status }) => {
  if (!status)
    return (
      <Frame>
        <Sealed>This update was only for their friends, so Whisprl cannot open it.</Sealed>
      </Frame>
    );

  const { content, file } = status;
  return (
    <Frame>
      {content?.kind === "text" ? (
        <Typography sx={{ fontSize: 14.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{content.text}</Typography>
      ) : (
        <Box
          component={content?.kind === "video" ? "video" : "img"}
          src={file?.url}
          alt="The reported update"
          controls={content?.kind === "video"}
          sx={{ maxWidth: "100%", maxHeight: 260, borderRadius: 1.5, display: "block" }}
        />
      )}
      {content?.caption && <Typography sx={{ mt: 1, fontSize: 13.5, color: "text.secondary" }}>{content.caption}</Typography>}
    </Frame>
  );
};

const GroupEvidence = ({ group }) => (
  <Frame>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {group.picture ? (
        <Box component="img" src={group.picture} alt="" sx={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <Box sx={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "action.selected" }}>
          <UsersThree size={22} aria-hidden />
        </Box>
      )}
      <Box>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{group.name}</Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{group.members === 1 ? "1 member" : `${group.members} members`}</Typography>
      </Box>
    </Stack>
  </Frame>
);

const PersonEvidence = ({ person }) => (
  <Frame>
    <Stack direction="row" alignItems="center" spacing={1.5}>
      {getAvatar(person?.avatar, `${person?.firstName ?? ""} ${person?.lastName ?? ""}`, 44)}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{person ? `${person.firstName} ${person.lastName}` : "A deleted account"}</Typography>
        {person?.activityStatus && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{person.activityStatus}</Typography>}
      </Box>
    </Stack>
  </Frame>
);

// only what the server can see is shown, and anything sealed says so rather than looking empty
const ReportSubject = ({ subject, reportedUser }) => {
  if (subject.kind === "status") return <StatusEvidence status={subject.status} />;
  if (subject.kind === "group") return <GroupEvidence group={subject.group} />;
  if (subject.kind === "chat") {
    return (
      <Frame>
        <Sealed>Their messages are encrypted, so Whisprl cannot read them. Only what the reporter wrote is below.</Sealed>
      </Frame>
    );
  }
  return <PersonEvidence person={reportedUser} />;
};

export default ReportSubject;
