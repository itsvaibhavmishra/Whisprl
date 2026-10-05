import { Box, useTheme } from "@mui/material";
import { m } from "framer-motion";

import getAvatar from "@/utils/createAvatar";

// slides only when it moves to another message, so it stays pinned to its bubble while the list shifts
const SeenMarker = ({ person, label, messageId }) => {
  const theme = useTheme();

  return (
    <m.div
      layoutId="seen-marker"
      layoutDependency={messageId}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      style={{ position: "absolute", right: -8, bottom: -8, lineHeight: 0 }}
    >
      <Box sx={{ borderRadius: "50%", border: 2, borderColor: "background.paper", lineHeight: 0 }}>
        {getAvatar(person.avatar, person.firstName, theme, 16)}
      </Box>
    </m.div>
  );
};

export default SeenMarker;
