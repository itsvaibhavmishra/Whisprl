import { useRef, useState } from "react";
import { Box } from "@mui/material";
import { ArrowBendUpLeft } from "phosphor-react";

const DECIDE_PX = 10;
const TRIGGER_PX = 56;
const MAX_PX = 72;

// a message pulled towards the middle of the chat starts a reply; direction is 1 for rightwards and -1 for leftwards
const useSwipeToReply = (direction, onReply) => {
  const [offset, setOffset] = useState(0);
  const gesture = useRef(null);
  const wasSwiped = useRef(false);

  const onTouchStart = (event) => {
    const { clientX, clientY } = event.touches[0];
    gesture.current = { x: clientX, y: clientY, pulled: 0, isSwiping: false };
    wasSwiped.current = false;
  };

  const onTouchMove = (event) => {
    const current = gesture.current;
    if (!current) return;
    const { clientX, clientY } = event.touches[0];
    const along = (clientX - current.x) * direction;
    const across = Math.abs(clientY - current.y);

    if (!current.isSwiping) {
      if (Math.max(Math.abs(along), across) < DECIDE_PX) return;
      // a mostly vertical drag is the chat scrolling, and a pull outwards is nothing
      if (across > Math.abs(along) || along < 0) {
        gesture.current = null;
        return;
      }
      current.isSwiping = true;
      wasSwiped.current = true;
    }

    const pulled = Math.min(Math.max(along, 0), MAX_PX);
    if (current.pulled < TRIGGER_PX && pulled >= TRIGGER_PX) navigator.vibrate?.(10);
    current.pulled = pulled;
    setOffset(pulled * direction);
  };

  const onTouchEnd = () => {
    if (gesture.current?.pulled >= TRIGGER_PX) onReply();
    gesture.current = null;
    setOffset(0);
  };

  return { offset, progress: Math.min(Math.abs(offset) / TRIGGER_PX, 1), wasSwiped, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
};

export const SwipeReplyHint = ({ progress, side }) => (
  <Box
    aria-hidden
    sx={{
      position: "absolute",
      [side]: 8,
      top: "50%",
      display: "grid",
      placeItems: "center",
      width: 28,
      height: 28,
      borderRadius: "50%",
      color: "text.secondary",
      bgcolor: "action.hover",
      opacity: progress,
      transform: `translateY(-50%) scale(${0.6 + 0.4 * progress})`,
    }}
  >
    <ArrowBendUpLeft size={16} />
  </Box>
);

export default useSwipeToReply;
