import { Box, ButtonBase, Skeleton, Stack, Typography } from "@mui/material";
import { Play } from "phosphor-react";

import ChatAvatar from "@/sections/chat/ChatAvatar";
import { PaneEmpty } from "@/sections/status/StatusPane";
import { ageOf } from "@/utils/statuses";

// previews are small thumbnails, so tiles stay near their size instead of stretching to fill the row
const TILE_MAX = 180;

const grid = { m: 0, p: 0, listStyle: "none", display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: `repeat(auto-fill, minmax(150px, ${TILE_MAX}px))` }, columnGap: 3, rowGap: 4 };

const DiscoverTile = ({ group, onOpen }) => {
  const { owner } = group;
  const latest = group.statuses.at(-1);
  const name = `${owner.firstName} ${owner.lastName}`;

  return (
    <li>
      <ButtonBase
        onClick={() => onOpen(owner._id)}
        aria-label={`${name}, ${ageOf(group.latestAt)}${group.hasUnseen ? ", not seen yet" : ""}`}
        sx={{
          width: "100%",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 1.5,
          borderRadius: 1.5,
          textAlign: "left",
          "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 4 },
          "&:hover img": { transform: "scale(1.04)" },
        }}
      >
        <Box sx={{ position: "relative", aspectRatio: "2 / 3", borderRadius: 1.5, overflow: "hidden", bgcolor: "chat.field" }}>
          {latest.content.file?.preview && (
            <Box
              component="img"
              src={latest.content.file.preview}
              alt=""
              sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover", transition: "transform 320ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}
            />
          )}
          {latest.content.kind === "video" && (
            <Box sx={{ position: "absolute", right: 8, top: 8, display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: "50%", color: "#fff", bgcolor: "rgba(0, 0, 0, 0.5)" }}>
              <Play size={14} weight="fill" />
            </Box>
          )}
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 0.25 }}>
          <ChatAvatar src={owner.avatar} name={owner.firstName} size={28} statuses={group.statuses} />
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
              {name}
            </Typography>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
              {ageOf(group.latestAt)}
            </Typography>
          </Box>
        </Stack>
      </ButtonBase>
    </li>
  );
};

const DiscoverGrid = ({ groups, isLoading, onOpen }) => {
  if (groups.length) {
    return (
      <Box component="ul" aria-label="Updates for everyone" sx={grid}>
        {groups.map((group) => (
          <DiscoverTile key={group.owner._id} group={group} onOpen={onOpen} />
        ))}
      </Box>
    );
  }
  if (!isLoading) return <PaneEmpty text="Nothing here yet. Updates people share with everyone on Whisprl show up here." />;
  return (
    <Box sx={grid} aria-hidden>
      {[0, 1, 2, 3].map((index) => (
        <Stack key={index} spacing={1.5}>
          <Skeleton variant="rounded" sx={{ width: "100%", height: "auto", aspectRatio: "2 / 3", borderRadius: 1.5 }} />
          <Skeleton width="60%" sx={{ borderRadius: 2 }} />
        </Stack>
      ))}
    </Box>
  );
};

export default DiscoverGrid;
