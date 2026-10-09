import { Box, ButtonBase, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { m } from "framer-motion";
import { Link } from "react-router-dom";

import ChatAvatar from "@/sections/chat/ChatAvatar";
import AvatarChoices from "@/sections/chat/status/AvatarChoices";
import useLiveStatuses from "@/sections/chat/status/useLiveStatuses";
import { contactPathOf } from "@/sections/contacts/contactsRoute";
import { SPOKEN_ONLY } from "@/utils/spokenOnly";

const AVATAR_SIZE = 50;
const ROW_SLIDE = { type: "spring", stiffness: 520, damping: 42 };
const SETTLE = { duration: 0.28, ease: [0.33, 1, 0.68, 1] };

// the row is a link, so the avatar's status button and the trailing action sit beside it as siblings rather than inside it
const PersonRow = ({ person, isSelected = false, isOnline = false, detail, action }) => {
  const statuses = useLiveStatuses(person._id);
  const name = `${person.firstName} ${person.lastName}`;

  return (
    <Box
      component={m.li}
      layout="position"
      transition={SETTLE}
      sx={{
        listStyle: "none",
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderRadius: 3,
        transition: "background-color 160ms ease",
        "&:hover": { bgcolor: isSelected ? "transparent" : "action.hover" },
      }}
    >
      {isSelected && (
        <Box
          component={m.span}
          layoutId="contacts-selected"
          transition={ROW_SLIDE}
          sx={{ position: "absolute", inset: 0, borderRadius: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }}
        />
      )}
      {statuses.length > 0 && (
        <AvatarChoices
          name={name}
          ownerId={person._id}
          hasStatus
          sx={{ position: "absolute", zIndex: 1, top: "50%", left: (theme) => theme.spacing(1), width: AVATAR_SIZE, height: AVATAR_SIZE, transform: "translateY(-50%)" }}
        />
      )}
      <ButtonBase
        component={Link}
        to={contactPathOf(person)}
        aria-current={isSelected ? "page" : undefined}
        sx={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          gap: 1.5,
          py: 1,
          px: 1,
          borderRadius: 3,
          justifyContent: "flex-start",
          textAlign: "left",
          "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
        }}
      >
        <ChatAvatar src={person.avatar} name={person.firstName} size={AVATAR_SIZE} isOnline={isOnline} statuses={statuses} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {name}
            {isOnline && (
              <Box component="span" sx={SPOKEN_ONLY}>
                , online
              </Box>
            )}
          </Typography>
          {person.username && (
            <Typography noWrap component="p" sx={{ m: 0, mt: 0.25, fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
              @{person.username}
            </Typography>
          )}
          {detail && (
            <Typography noWrap component="p" sx={{ m: 0, mt: 0.25, fontSize: 12.5, fontWeight: 600, color: "text.secondary" }}>
              {detail}
            </Typography>
          )}
        </Box>
      </ButtonBase>
      {action && <Box sx={{ position: "relative", flexShrink: 0, pr: 1 }}>{action}</Box>}
    </Box>
  );
};

// a row pads its avatar in from its hover, so a list in a pane reaches out by that much to line the avatar up with the column
export const PersonRows = ({ children }) => (
  <Box component="ul" sx={{ m: 0, mt: 1, mx: -1, p: 0 }}>
    {children}
  </Box>
);

export const PersonSkeletons = () => (
  <Stack spacing={0.5} sx={{ pt: 1 }} aria-hidden>
    {[0, 1, 2].map((index) => (
      <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
        <Skeleton variant="circular" width={AVATAR_SIZE} height={AVATAR_SIZE} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width={`${40 + index * 12}%`} sx={{ borderRadius: 2 }} />
          <Skeleton width={`${25 + index * 8}%`} sx={{ borderRadius: 2 }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

export default PersonRow;
