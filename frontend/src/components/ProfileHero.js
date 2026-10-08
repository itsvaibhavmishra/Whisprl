import { Avatar, Box, Typography } from "@mui/material";

import ProfileCover from "@/components/ProfileCover";
import { bubbleShape } from "@/sections/welcome/HeroConversation";
import Wordmark from "@/components/Wordmark";
import { avatarLookOf } from "@/utils/avatars";

const PHOTO_SIZE = { xs: 104, md: 148 };
const RING = 6;

const PHOTO_AT = {
  xs: { x: 16 + RING + PHOTO_SIZE.xs / 2, radius: PHOTO_SIZE.xs / 2 + RING },
  md: { x: 32 + RING + PHOTO_SIZE.md / 2, radius: PHOTO_SIZE.md / 2 + RING },
};

const Photo = ({ src, name, children }) => {
  const { initial, background } = avatarLookOf(name);
  return (
    <Box
      sx={{
        position: "relative",
        alignSelf: "start",
        mt: { xs: `-${PHOTO_SIZE.xs / 2 + RING}px`, md: `-${PHOTO_SIZE.md / 2 + RING}px` },
      }}
    >
      <Avatar
        src={src || undefined}
        alt=""
        sx={{
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
          fontSize: { xs: 44, md: 60 },
          fontWeight: 800,
          color: "common.white",
          background,
          border: RING,
          borderColor: "background.default",
          boxSizing: "content-box",
        }}
      >
        {initial}
      </Avatar>
      {children}
    </Box>
  );
};

// The status reads as a message the person is sending, so its tail points back at their photo.
const StatusBubble = ({ status }) => (
  <Box
    sx={{
      ...bubbleShape(false),
      alignSelf: "end",
      justifySelf: "start",
      mt: 1.5,
      mb: { xs: 0.5, md: 2 },
      maxWidth: "min(100%, 44ch)",
      bgcolor: "background.paper",
      overflowWrap: "anywhere",
    }}
  >
    {status}
  </Box>
);

const ProfileHero = ({ profile, coverAction, photoAction }) => {
  const { firstName, lastName, username, avatar, activityStatus } = profile;
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <Box>
      <ProfileCover profile={profile} photoAt={PHOTO_AT} sx={{ aspectRatio: "3 / 1", borderRadius: { xs: "20px", md: "28px" } }}>
        {coverAction && <Box sx={{ position: "absolute", top: 12, right: 12 }}>{coverAction}</Box>}
      </ProfileCover>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr)",
          columnGap: { xs: 1.5, md: 2.5 },
          px: { xs: 2, md: 4 },
        }}
      >
        <Photo src={avatar} name={firstName}>
          {photoAction && <Box sx={{ position: "absolute", right: 0, bottom: 4 }}>{photoAction}</Box>}
        </Photo>
        {activityStatus && <StatusBubble status={activityStatus} />}
      </Box>
      <Typography component="h2" sx={{ m: 0, mt: { xs: 2, md: 2.5 }, px: { xs: 2, md: 4 }, overflowWrap: "anywhere" }}>
        <Wordmark name={fullName} fontSize={{ xs: "2.5rem", sm: "3rem", md: "4rem" }} />
      </Typography>
      {username && (
        <Typography sx={{ mt: 0.5, px: { xs: 2, md: 4 }, color: "text.secondary", fontWeight: 600 }}>@{username}</Typography>
      )}
    </Box>
  );
};

export default ProfileHero;
