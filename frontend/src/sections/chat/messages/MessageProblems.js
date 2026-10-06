import { Button, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { RemoveUnsentAttachment, RetryUpload, UploadAttachment } from "@/redux/slices/actions/attachmentActions";
import { DiscardMessage, SendAgain } from "@/redux/slices/actions/chatActions";
import { sealedCopyOf, sentMessageIdOf } from "@/utils/attachments";

const ProblemRow = ({ text, children }) => (
  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ alignSelf: "flex-end" }}>
    <Typography variant="caption" sx={{ color: "error.main" }}>
      {text}
    </Typography>
    {children}
  </Stack>
);

// a file that was never encrypted has no key to send, so it can only be deleted and chosen again
export const NotSent = ({ entry }) => {
  const dispatch = useDispatch();
  const canSendAgain = !entry.file || Boolean(entry.file.key);

  return (
    <ProblemRow text={entry.error ? `Not sent: ${entry.error}` : "Not sent"}>
      {canSendAgain && (
        <Button size="small" onClick={() => dispatch(SendAgain(entry.clientId))}>
          Send again
        </Button>
      )}
      <Button size="small" color="inherit" onClick={() => dispatch(DiscardMessage(entry.clientId))}>
        Delete
      </Button>
    </ProblemRow>
  );
};

// the message was saved but its file never arrived; the file can be sent again only from the tab that still holds it
export const DidNotUpload = ({ message }) => {
  const dispatch = useDispatch();
  const isUploading = useIsLoading(UploadAttachment, message.clientId);
  const hasFailed = useSelector((state) => state.chat.failedUploads.includes(message.clientId));
  const canRetry = Boolean(sealedCopyOf(message.clientId) && sentMessageIdOf(message.clientId));

  if (isUploading || (canRetry && !hasFailed)) return null;

  return (
    <ProblemRow text="Didn't upload">
      {canRetry && (
        <Button size="small" onClick={() => dispatch(RetryUpload(message.clientId))}>
          Retry
        </Button>
      )}
      <Button size="small" color="inherit" onClick={() => dispatch(RemoveUnsentAttachment(message))}>
        Remove
      </Button>
    </ProblemRow>
  );
};
