import { Box } from "@mui/material";

import ChatAvatar from "@/sections/chat/ChatAvatar";
import StatusArcs from "@/components/StatusArcs";

const HALO_WIDTH = 4;
const AVATAR_SIZE = 112;

// the ring only ever shows a status, and its space stays empty without one so the avatar never shifts
const HaloAvatar = ({ src, name, isOnline, statuses, children }) => (
  <Box sx={{ position: "relative", p: `${2 * HALO_WIDTH}px` }}>
    {statuses?.length > 0 && <StatusArcs statuses={statuses} size={AVATAR_SIZE + 4 * HALO_WIDTH} stroke={HALO_WIDTH} sx={{ top: 0, left: 0 }} />}
    <ChatAvatar src={src} name={name} size={AVATAR_SIZE} isOnline={isOnline} />
    {children}
  </Box>
);

export default HaloAvatar;
