import { useRef, useState } from "react";
import { Box } from "@mui/material";

import EmojiPicker from "@/components/EmojiPicker";
import useScreenBack from "@/hooks/useScreenBack";

// how far down the screen a panel pulled all the way up stops, so the chat's header and the field above it stay in view
const KEEP_ABOVE = 210;
// a pull this far below the panel's own height puts it away
const CLOSE_PULL = 0.4;

const EmojiPanel = ({ baseHeight, onSelect, onClose }) => {
  const [height, setHeight] = useState(baseHeight);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef(null);
  useScreenBack(onClose);

  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    // the conversation above gives up its room as the panel grows, so how far it can go is read from where it sits now
    const tallest = Math.max(baseHeight, height + event.currentTarget.getBoundingClientRect().top - KEEP_ABOVE);
    drag.current = { startY: event.clientY, startHeight: height, tallest };
    setIsDragging(true);
  };
  const move = (event) => {
    if (!drag.current) return;
    setHeight(Math.min(drag.current.tallest, drag.current.startHeight + drag.current.startY - event.clientY));
  };
  const end = () => {
    if (!drag.current) return;
    const { tallest } = drag.current;
    drag.current = null;
    setIsDragging(false);
    if (height < baseHeight * (1 - CLOSE_PULL)) onClose();
    else setHeight(height > (baseHeight + tallest) / 2 ? tallest : baseHeight);
  };

  return (
    <Box
      sx={{
        height: Math.max(height, 0),
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        pb: "env(safe-area-inset-bottom)",
        transition: isDragging ? "none" : "height 220ms cubic-bezier(0.2, 0.8, 0.3, 1)",
      }}
    >
      <Box
        role="separator"
        aria-label="Drag to resize the emoji panel"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        sx={{ flexShrink: 0, py: 1, display: "grid", placeItems: "center", touchAction: "none", cursor: "grab" }}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "text.disabled" }} />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <EmojiPicker onSelect={onSelect} autoFocus={false} isPanel />
      </Box>
    </Box>
  );
};

export default EmojiPanel;
