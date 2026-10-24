import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";

import { openedFileUrl } from "@/utils/attachments";

const nameOf = (person) => (person ? `${person.firstName} ${person.lastName}` : "A deleted account");

const CHECKS = {
  verified: { label: "Checked against what was sent", color: "success.main" },
  unchecked: { label: "Sent before Whisprl could check this", color: "text.secondary" },
  failed: { label: "Does not match what was sent", color: "error.main" },
};

const EvidenceFile = ({ file }) => {
  const [url, setUrl] = useState(null);
  const [hasFailed, setHasFailed] = useState(false);

  // the key the reporter sent opens this one file, and it is decrypted here rather than on the server
  useEffect(() => {
    let isOn = true;
    openedFileUrl(file).then(
      (opened) => isOn && setUrl(opened),
      () => isOn && setHasFailed(true)
    );
    return () => {
      isOn = false;
    };
  }, [file]);

  if (hasFailed) return <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{`${file.name ?? "A file"} could not be opened`}</Typography>;
  if (!url) return <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>Opening the attachment…</Typography>;
  if (!file.mimeType?.startsWith("image/") && !file.mimeType?.startsWith("video/")) {
    return (
      <Typography component="a" href={url} download={file.name} sx={{ fontSize: 13, fontWeight: 600 }}>
        {file.name ?? "Download the file"}
      </Typography>
    );
  }

  return (
    <Box
      component={file.mimeType.startsWith("video/") ? "video" : "img"}
      src={url}
      alt={file.name ?? "An attached file"}
      controls={file.mimeType.startsWith("video/")}
      sx={{ mt: 0.5, maxWidth: "100%", maxHeight: 220, borderRadius: 1.5, display: "block" }}
    />
  );
};

const EvidenceTranscript = ({ evidence }) => (
  <Box sx={{ mt: 1.5, borderRadius: 2, bgcolor: "action.hover", overflow: "hidden" }}>
    <Typography sx={{ px: 1.5, pt: 1.25, fontSize: 12, fontWeight: 700, color: "text.secondary" }}>Sent by the reporter from this chat.</Typography>
    <Stack component="ol" sx={{ m: 0, p: 1.5, listStyle: "none", gap: 1.25 }}>
      {evidence.map((entry, position) => (
        <Box
          component="li"
          key={entry.message ?? position}
          sx={{
            p: 1.25,
            borderRadius: 1.5,
            bgcolor: "background.paper",
            ...(entry.isReported && { boxShadow: (theme) => `inset 0 0 0 2px ${alpha(theme.palette.error.main, 0.6)}` }),
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{nameOf(entry.sender)}</Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{dayjs(entry.sentAt).format("D MMM, HH:mm")}</Typography>
            {entry.isReported && <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "error.main" }}>The reported message</Typography>}
          </Stack>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: CHECKS[entry.check].color }}>{CHECKS[entry.check].label}</Typography>
          {entry.text && <Typography sx={{ mt: 0.25, fontSize: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{entry.text}</Typography>}
          {entry.files?.map((file) => (
            <EvidenceFile key={file.url} file={file} />
          ))}
        </Box>
      ))}
    </Stack>
  </Box>
);

export default EvidenceTranscript;
