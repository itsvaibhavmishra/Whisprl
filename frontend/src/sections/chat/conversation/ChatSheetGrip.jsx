import { useRef } from "react";
import { Box } from "@mui/material";

const CLOSE_AFTER = 70;
const STILL_A_TAP = 6;

// a sheet on a phone is put away by dragging it down, so the bar at its top does that as well as take a tap
const ChatSheetGrip = ({ onClose, onDrag }) => {
  const from = useRef(null);

  const finish = (event) => {
    if (from.current === null) return;
    const travelled = Math.max(0, event.clientY - from.current);
    from.current = null;
    onDrag(0);
    if (travelled > CLOSE_AFTER || travelled < STILL_A_TAP) onClose();
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Close the chat"
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        from.current = event.clientY;
      }}
      onPointerMove={(event) => {
        if (from.current !== null) onDrag(Math.max(0, event.clientY - from.current));
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      sx={{ py: 1.25, display: "grid", placeItems: "center", cursor: "grab", touchAction: "none", flexShrink: 0, outline: "none" }}
    >
      <Box sx={{ width: 42, height: 4, borderRadius: 99, bgcolor: "rgba(255, 255, 255, 0.5)" }} />
    </Box>
  );
};

export default ChatSheetGrip;
