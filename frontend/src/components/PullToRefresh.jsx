import { useRef } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";

import usePullToRefresh, { PULL_TO_RELOAD } from "@/hooks/usePullToRefresh";

// a pull let go fully shown leaves the arrow this far round, so the spin carries on from there instead of jumping back
const READY_TURN = 270;
const spin = keyframes`from { transform: rotate(${READY_TURN}deg); } to { transform: rotate(${READY_TURN + 360}deg); }`;
const SIZE = 40;

// the arrow turns as it is pulled into view and fills in once letting go would reload, as a phone's own lists do
export const PullIndicator = ({ pull, isRefreshing, edge = "top" }) => {
  const progress = Math.min(pull / PULL_TO_RELOAD, 1);
  const isReady = progress >= 1;
  const travel = pull - SIZE - 8;

  return (
    <Box
      role={isRefreshing ? "status" : undefined}
      aria-label={isRefreshing ? "Refreshing" : undefined}
      aria-hidden={!isRefreshing}
      sx={{
        position: "absolute",
        left: "50%",
        [edge]: 0,
        zIndex: 2,
        width: SIZE,
        height: SIZE,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: "background.paper",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
        color: isReady ? "primary.main" : "text.secondary",
        opacity: pull ? 1 : 0,
        transform: `translate(-50%, ${edge === "top" ? travel : -travel}px)`,
        transition: "transform 140ms ease-out, opacity 140ms ease-out, color 140ms",
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          transform: `rotate(${progress * READY_TURN}deg)`,
          animation: isRefreshing ? `${spin} 0.8s linear infinite` : "none",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <ArrowClockwiseIcon size={22} weight={isReady ? "bold" : "regular"} />
      </Box>
    </Box>
  );
};

const PullToRefresh = ({ onRefresh, sx, children }) => {
  const scrollRef = useRef(null);
  const { pull, isRefreshing } = usePullToRefresh(scrollRef, onRefresh);

  return (
    <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box ref={scrollRef} sx={{ flex: 1, minHeight: 0, overscrollBehaviorY: "contain", ...sx }}>
        {children}
      </Box>
      <PullIndicator pull={pull} isRefreshing={isRefreshing} />
    </Box>
  );
};

export default PullToRefresh;
