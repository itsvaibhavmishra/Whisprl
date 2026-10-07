import { Box } from "@mui/material";

import StatusArcs from "@/components/StatusArcs";
import getAvatar from "@/utils/avatars";

const STROKE = 2.5;

const StatusRing = ({ person, statuses, size }) => (
  <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
    <StatusArcs statuses={statuses} size={size} stroke={STROKE} sx={{ top: 0, left: 0 }} />
    <Box sx={{ position: "absolute", inset: STROKE + 2, display: "grid", "& > *": { width: "100%", height: "100%" } }}>
      {getAvatar(person.avatar, person.firstName, size - 2 * (STROKE + 2))}
    </Box>
  </Box>
);

export default StatusRing;
