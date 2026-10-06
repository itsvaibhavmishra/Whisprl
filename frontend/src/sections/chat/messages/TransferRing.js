import { Box, ButtonBase, CircularProgress } from "@mui/material";
import { X } from "phosphor-react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

import { CancelTransfer } from "@/redux/slices/actions/attachmentActions";

// a group shows one circle for all its files: a finished file counts as done, one waiting its turn as not started
export const useTransfer = (files) => {
  const dispatch = useDispatch();
  const percents = useSelector((state) => files.map((file) => state.chat.transfers[file.localId]), shallowEqual);
  if (percents.every((percent) => percent === undefined)) return null;

  const total = files.reduce((sum, file, index) => sum + (percents[index] ?? (file.isUploading ? 0 : 100)), 0);
  return {
    percent: Math.floor(total / files.length),
    cancel: () => files.forEach((file) => dispatch(CancelTransfer(file.localId))),
  };
};

// a sliver of the ring shows from the start, so a send that has only just begun still reads as one
export const MIN_VISIBLE_PERCENT = 4;

const TransferRing = ({ transfer, size = 56 }) => (
  <Box sx={{ position: "relative", width: size, height: size, borderRadius: "50%", bgcolor: "rgba(0, 0, 0, 0.55)" }}>
    <CircularProgress
      variant="determinate"
      value={Math.max(transfer.percent, MIN_VISIBLE_PERCENT)}
      size={size}
      thickness={2.5}
      aria-label={`Sending, ${transfer.percent}%`}
      sx={{ position: "absolute", inset: 0, color: "#fff" }}
    />
    <ButtonBase
      aria-label="Cancel sending"
      onClick={(event) => {
        event.stopPropagation();
        transfer.cancel();
      }}
      sx={{ position: "absolute", inset: 0, borderRadius: "50%", color: "#fff" }}
    >
      <X size={size * 0.38} />
    </ButtonBase>
  </Box>
);

// clicks beside the ring still reach what is underneath it
export const TransferOverlay = ({ transfer }) => (
  <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", "& > *": { pointerEvents: "auto" } }}>
    <TransferRing transfer={transfer} />
  </Box>
);

export default TransferRing;
