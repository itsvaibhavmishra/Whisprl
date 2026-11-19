import { Badge } from "@mui/material";

import { NIGHT_INK } from "@/utils/colorPresets";

const CountBadge = ({ count, children }) => (
  <Badge
    badgeContent={count}
    sx={{ "& .MuiBadge-badge": { bgcolor: "primary.glow", color: NIGHT_INK, fontWeight: 800, minWidth: 18, height: 18, fontSize: 11 } }}
  >
    {children}
  </Badge>
);

export default CountBadge;
