import { Box, Stack, Typography } from "@mui/material";

import PersonTag from "@/components/PersonTag";
import getAvatar from "@/utils/avatars";

const BadgeHero = ({ person, action }) => {
  const { name } = person;
  const count = person.badges?.length ?? 0;

  return (
    <Box sx={{ borderRadius: 3, bgcolor: "background.paper", border: 1, borderColor: "divider", overflow: "hidden" }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 2.5 }}>
        {getAvatar(person.avatar, name, 64)}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800, overflowWrap: "anywhere" }}>{name}</Typography>
          {person.username && <Typography sx={{ mt: 0.25, fontSize: 14, fontWeight: 600, color: "text.secondary" }}>@{person.username}</Typography>}
          {person.tag && (
            <Box sx={{ mt: 0.75 }}>
              <PersonTag tag={person.tag} />
            </Box>
          )}
        </Box>
        <Stack sx={{ alignItems: "center", flexShrink: 0 }}>
          <Typography sx={{ fontSize: 34, lineHeight: 1, fontWeight: 800, color: "primary.main" }}>{count}</Typography>
          <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{count === 1 ? "badge" : "badges"}</Typography>
        </Stack>
      </Stack>
      {action && <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1.5, pb: 1, mt: -1.5 }}>{action}</Box>}
    </Box>
  );
};

export default BadgeHero;
