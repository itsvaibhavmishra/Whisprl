import { Box, Stack, useTheme } from "@mui/material";
import { m } from "framer-motion";

import getAvatar from "@/utils/createAvatar";

const SLIDE = { type: "spring", stiffness: 420, damping: 34 };

const SeenPhoto = ({ person }) => {
  const theme = useTheme();

  return (
    <Box sx={{ borderRadius: "50%", border: 2, borderColor: "background.paper", lineHeight: 0 }}>
      {getAvatar(person.avatar, person.firstName, theme, 16)}
    </Box>
  );
};

// slides only when it moves to another message, so it stays pinned to its bubble while the list shifts
const SeenMarker = ({ person, label, messageId }) => (
  <m.div
    layoutId="seen-marker"
    layoutDependency={messageId}
    {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    transition={SLIDE}
    style={{ position: "absolute", right: -8, bottom: -8, lineHeight: 0 }}
  >
    <SeenPhoto person={person} />
  </m.div>
);

export default SeenMarker;

export const SeenByRow = ({ people }) => (
  <Stack
    direction="row"
    role="img"
    aria-label={`Seen by ${people.map((person) => person.firstName).join(", ")}`}
    sx={{ alignSelf: "flex-end", gap: 0.25 }}
  >
    {people.map((person) => (
      <m.div key={person._id} layoutId={`seen-${person._id}`} transition={SLIDE} style={{ lineHeight: 0 }}>
        <SeenPhoto person={person} />
      </m.div>
    ))}
  </Stack>
);
