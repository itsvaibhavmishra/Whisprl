import { useState } from "react";
import { Avatar, Box, Skeleton, Stack, Typography, useMediaQuery } from "@mui/material";
import { ImageSquare } from "phosphor-react";

import ProfileCover from "@/components/ProfileCover";
import StatusArcs from "@/components/StatusArcs";
import Wordmark from "@/components/Wordmark";
import PhotoViewer from "@/sections/chat/details/PhotoViewer";
import AvatarChoices from "@/sections/chat/status/AvatarChoices";
import useLiveStatuses from "@/sections/chat/status/useLiveStatuses";
import { bubbleShape } from "@/sections/welcome/HeroConversation";
import { avatarLookOf } from "@/utils/avatars";

const RING = 6;

// the ring takes the colour of whatever the profile sits on, so the photo reads as cut out of the cover
const SIZES = {
  page: {
    wide: { photo: 148, gutter: 32, name: "4rem", radius: 28, surface: "background.default" },
    narrow: { photo: 104, gutter: 16, name: "2.5rem", radius: 20, surface: "background.default" },
  },
  sheet: { photo: 96, gutter: 24, name: "2.25rem", radius: 0, surface: "background.paper" },
  panel: { photo: 88, gutter: 20, name: "1.9rem", radius: 0, surface: "chat.list" },
};

const useSizeOf = (size) => {
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const sizes = SIZES[size];
  return sizes.wide ? sizes[isWide ? "wide" : "narrow"] : sizes;
};

const Photo = ({ person, look, isOnline, statuses, children }) => {
  const { initial, background } = avatarLookOf(person.firstName);
  const outer = look.photo + 2 * RING;
  return (
    <Box sx={{ position: "relative", alignSelf: "start", width: outer, height: outer, mt: `-${outer / 2}px` }}>
      <Avatar
        src={person.avatar || undefined}
        alt=""
        sx={{
          width: look.photo,
          height: look.photo,
          fontSize: look.photo * 0.42,
          fontWeight: 800,
          color: "common.white",
          background,
          border: RING,
          borderColor: look.surface,
          boxSizing: "content-box",
        }}
      >
        {initial}
      </Avatar>
      {statuses.length > 0 && <StatusArcs statuses={statuses} size={outer} stroke={RING - 2} sx={{ top: 0, left: 0 }} />}
      {isOnline && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            right: RING + look.photo * 0.04,
            bottom: RING + look.photo * 0.04,
            width: look.photo * 0.2,
            height: look.photo * 0.2,
            borderRadius: "50%",
            bgcolor: "success.main",
            border: 3,
            borderColor: look.surface,
          }}
        />
      )}
      {children}
    </Box>
  );
};

// the status reads as a message the person is sending, so its tail points back at their photo
const StatusBubble = ({ status }) => (
  <Box sx={{ ...bubbleShape(false), alignSelf: "end", justifySelf: "start", mt: 1.5, maxWidth: "min(100%, 44ch)", bgcolor: "background.paper", overflowWrap: "anywhere" }}>
    {status}
  </Box>
);

const IdentitySkeleton = ({ look }) => (
  <Box aria-hidden>
    <Skeleton variant="rectangular" sx={{ aspectRatio: "3 / 1", height: "auto", borderRadius: `${look.radius}px` }} />
    <Box sx={{ px: `${look.gutter}px` }}>
      <Skeleton variant="circular" width={look.photo + 2 * RING} height={look.photo + 2 * RING} sx={{ mt: `-${look.photo / 2 + RING}px` }} />
      <Skeleton width="55%" height={48} />
      <Skeleton width="30%" />
    </Box>
  </Box>
);

const ProfileIdentity = ({ person, size = "sheet", isOnline = false, coverAction, photoAction }) => {
  const look = useSizeOf(size);
  const statuses = useLiveStatuses(person._id);
  const [isViewingPhoto, setIsViewingPhoto] = useState(false);

  const isKnown = person.firstName !== undefined;
  if (!isKnown) return <IdentitySkeleton look={look} />;

  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const photoAt = { xs: { x: look.gutter + RING + look.photo / 2, radius: look.photo / 2 + RING } };
  const photoView = person.avatar ? { noun: "profile picture", label: "View profile picture", icon: ImageSquare, onChoose: () => setIsViewingPhoto(true) } : null;

  return (
    <Box>
      <ProfileCover profile={person} photoAt={photoAt} sx={{ aspectRatio: "3 / 1", borderRadius: `${look.radius}px` }}>
        {coverAction && <Box sx={{ position: "absolute", top: 12, right: 12 }}>{coverAction}</Box>}
      </ProfileCover>

      <Box sx={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", columnGap: 2, px: `${look.gutter}px` }}>
        <Photo person={person} look={look} isOnline={isOnline} statuses={statuses}>
          <AvatarChoices name={fullName} ownerId={person._id} hasStatus={statuses.length > 0} other={photoView} sx={{ position: "absolute", inset: RING }} />
          {photoAction && <Box sx={{ position: "absolute", right: 0, bottom: 4 }}>{photoAction}</Box>}
        </Photo>
        {person.activityStatus && <StatusBubble status={person.activityStatus} />}
      </Box>

      <Box sx={{ px: `${look.gutter}px`, mt: 2 }}>
        <Typography component="h2" sx={{ m: 0, overflowWrap: "anywhere" }}>
          <Wordmark name={fullName} fontSize={look.name} />
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.75, color: "text.secondary", fontWeight: 600 }}>
          {person.username && <Typography sx={{ fontWeight: "inherit" }}>@{person.username}</Typography>}
          {isOnline && <Typography sx={{ fontWeight: "inherit", fontSize: 14 }}>Online</Typography>}
        </Stack>
      </Box>

      {isViewingPhoto && <PhotoViewer src={person.avatar} name={fullName} onClose={() => setIsViewingPhoto(false)} />}
    </Box>
  );
};

export default ProfileIdentity;
