import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";

import useIsLoading from "@/hooks/useIsLoading";
import { DismissReport } from "@/redux/slices/actions/adminActions";
import PersonActions from "@/sections/admin/PersonActions";
import EvidenceTranscript from "@/sections/admin/EvidenceTranscript";
import ReportSubject from "@/sections/admin/ReportSubject";
import getAvatar from "@/utils/avatars";

const ABOUT = { person: "a person", chat: "a chat", group: "a group", status: "an update" };

const nameOf = (person) => (person ? `${person.firstName} ${person.lastName}` : "A deleted account");

const DismissDialog = ({ report, onClose, onDone }) => {
  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const isWorking = useIsLoading(DismissReport);

  const dismiss = async () => {
    const result = await dispatch(DismissReport({ reportId: report._id, reason }));
    if (!DismissReport.fulfilled.match(result)) return;
    onClose();
    onDone();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Dismiss this report?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14.5 }}>Nothing happens to the reported account. The audit log keeps a note of this.</DialogContentText>
        <TextField fullWidth multiline minRows={2} label="Why (optional)" value={reason} onChange={(event) => setReason(event.target.value)} sx={{ mt: 2.5 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" loading={isWorking} onClick={dismiss}>
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReportCard = ({ report, onChanged }) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const isOpen = !report.outcome;

  return (
    <Box component="li" sx={{ py: 2.5, borderTop: 1, borderColor: "divider" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", flexWrap: "wrap", gap: 0.75 }}>
        <Typography sx={{ fontSize: 15.5, fontWeight: 800, textTransform: "capitalize" }}>{report.reason}</Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{`about ${ABOUT[report.subject.kind]}`}</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography component="time" dateTime={report.createdAt} sx={{ fontSize: 12.5, color: "text.secondary" }}>
          {dayjs(report.createdAt).format("D MMM YYYY")}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 1, color: "text.secondary" }}>
        {getAvatar(report.reporter?.avatar, nameOf(report.reporter), 20)}
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{`Reported by ${nameOf(report.reporter)}`}</Typography>
      </Stack>

      {report.note && (
        <Typography
          component="blockquote"
          sx={{ m: 0, mt: 1.5, pl: 1.5, borderLeft: 3, borderColor: "primary.main", fontSize: 14, lineHeight: 1.5, overflowWrap: "anywhere" }}
        >
          {report.note}
        </Typography>
      )}

      {report.evidence?.length ? (
        <EvidenceTranscript evidence={report.evidence} />
      ) : (
        <ReportSubject subject={report.subject} reportedUser={report.reportedUser} />
      )}

      {report.reportedUser && (
        <Typography sx={{ mt: 1.5, fontSize: 13, color: "text.secondary" }}>
          {`About ${nameOf(report.reportedUser)}`}
          {report.openAbout > 1 && ` · ${report.openAbout} open reports about them`}
        </Typography>
      )}

      {isOpen ? (
        <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", mt: 2, gap: 1 }}>
          <Button size="small" variant="outlined" color="inherit" onClick={() => setIsDismissing(true)}>
            Dismiss
          </Button>
          {report.reportedUser && <PersonActions person={report.reportedUser} reportId={report._id} onDone={onChanged} />}
        </Stack>
      ) : (
        <Typography sx={{ mt: 2, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          {`${report.outcome === "actioned" ? "Actioned" : "Dismissed"} by ${nameOf(report.closedBy)} on ${dayjs(report.closedAt).format("D MMM YYYY")}`}
        </Typography>
      )}

      {isDismissing && <DismissDialog report={report} onClose={() => setIsDismissing(false)} onDone={onChanged} />}
    </Box>
  );
};

export default ReportCard;
