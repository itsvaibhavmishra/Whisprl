import { Box, Stack, Typography } from "@mui/material";
import { BellRingingIcon } from "@phosphor-icons/react";

import useSettings from "@/hooks/useSettings";
import { AUDIENCES } from "@/sections/admin/AnnouncementForm";
import NoticeText from "@/sections/chat/messages/NoticeText";
import { formatClock, formatDayLabel } from "@/utils/formatMessageTime";

const authorOf = (author) => (author ? `${author.firstName} ${author.lastName}`.trim() : "A deleted account");

const progressOf = ({ reached, audienceSize, finishedAt }) =>
  finishedAt
    ? `Reached ${reached.toLocaleString()} of ${audienceSize.toLocaleString()}`
    : `Sending, ${reached.toLocaleString()} of ${audienceSize.toLocaleString()} so far`;

const SentAnnouncement = ({ announcement }) => {
  const { use24Hour } = useSettings();
  const { text, button, audience, isPushed, author, createdAt, finishedAt } = announcement;
  const byline = `${authorOf(author)}, ${formatDayLabel(createdAt)} ${formatClock(createdAt, use24Hour)}`;

  return (
    <Box component="li" sx={{ py: 2, borderBottom: 1, borderColor: "divider" }}>
      <NoticeText text={text} sx={{ fontSize: 15, lineHeight: 1.5 }} />
      {button?.label && <Typography sx={{ mt: 0.75, fontSize: 13, fontWeight: 700, color: "primary.main" }}>{`Button: ${button.label}`}</Typography>}
      <Stack direction="row" useFlexGap spacing={1.5} sx={{ mt: 1, flexWrap: "wrap", alignItems: "center", fontSize: 13, color: "text.secondary" }}>
        <Typography component="span" sx={{ fontSize: "inherit" }}>
          {byline}
        </Typography>
        <Typography component="span" sx={{ fontSize: "inherit" }}>
          {AUDIENCES.find((option) => option.value === audience)?.label}
        </Typography>
        {isPushed && (
          <Stack component="span" direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <BellRingingIcon size={14} aria-hidden />
            <span>Notified</span>
          </Stack>
        )}
        <Typography component="span" sx={{ fontSize: "inherit", fontWeight: 700, color: finishedAt ? "text.secondary" : "primary.main" }}>
          {progressOf(announcement)}
        </Typography>
      </Stack>
    </Box>
  );
};

export default SentAnnouncement;
