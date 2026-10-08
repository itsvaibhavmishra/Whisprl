import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import useIsLoading from "@/hooks/useIsLoading";
import useMessageTime from "@/hooks/useMessageTime";
import { GetDiscover } from "@/redux/slices/actions/statusActions";
import StatusRing from "@/sections/status/StatusRing";

const DiscoverGrid = ({ groups, onOpen }) => {
  const messageTime = useMessageTime();
  const isLoading = useIsLoading(GetDiscover);

  if (!groups.length) {
    return isLoading ? null : <Typography sx={{ color: "text.secondary", textAlign: "center", px: 3, py: 6 }}>No updates for everyone from people beyond your friends right now.</Typography>;
  }

  return (
    <Box component="ul" aria-label="Updates for everyone" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1.5 }}>
      {groups.map((group) => {
        const name = `${group.owner.firstName} ${group.owner.lastName}`;
        const { preview } = group.statuses.at(-1).content.file;
        return (
          <li key={group.owner._id}>
            <ButtonBase
              onClick={() => onOpen(group.owner._id)}
              aria-label={`${name}, ${messageTime(group.latestAt)}${group.hasUnseen ? ", not seen yet" : ""}`}
              sx={{ position: "relative", display: "block", width: "100%", aspectRatio: "9 / 16", borderRadius: 3, overflow: "hidden", bgcolor: "#000" }}
            >
              {preview && <Box component="img" src={preview} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: 1, color: "#fff", textAlign: "left", background: "linear-gradient(transparent, rgba(0, 0, 0, 0.7))" }}
              >
                <StatusRing person={group.owner} statuses={group.statuses} size={34} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" component="p" noWrap sx={{ m: 0, fontWeight: 700 }}>
                    {name}
                  </Typography>
                  <Typography variant="caption" component="p" sx={{ m: 0, opacity: 0.8 }}>
                    {messageTime(group.latestAt)}
                  </Typography>
                </Box>
              </Stack>
            </ButtonBase>
          </li>
        );
      })}
    </Box>
  );
};

export default DiscoverGrid;
