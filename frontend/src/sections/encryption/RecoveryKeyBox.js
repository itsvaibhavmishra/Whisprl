import { Box } from "@mui/material";

export const downloadRecoveryKey = (recoveryKey) => {
  const text = `Whisprl recovery key\n\n${recoveryKey}\n\nUse it to open your messages on a new browser. Keep it private.\n`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  link.download = "whisprl-recovery-key.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};

const RecoveryKeyBox = ({ recoveryKey }) => (
  <Box
    sx={{
      py: 2,
      px: 1.5,
      borderRadius: 2,
      bgcolor: "action.hover",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: { xs: 15, sm: 19 },
      fontWeight: 600,
      letterSpacing: "0.06em",
      textAlign: "center",
      userSelect: "all",
      overflowWrap: "anywhere",
    }}
  >
    {recoveryKey}
  </Box>
);

export default RecoveryKeyBox;
