import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";

import { bubbleShape } from "@/sections/welcome/HeroConversation";
import { openNote } from "@/utils/crypto/noteCipher";
import { SPOKEN_ONLY } from "@/utils/spokenOnly";

// a chat bubble is white on the grey chat canvas, but a note can sit on any surface, so it takes a tint of the text
const ON_ANY_SURFACE = { background: (theme) => alpha(theme.palette.text.primary, 0.06), boxShadow: "none" };

const Quiet = ({ children }) => <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>{children}</Typography>;

const RequestNote = ({ request, isMine }) => {
  const meId = useSelector((state) => state.user.user._id);
  const isReady = useSelector((state) => state.encryption.status === "ready");
  const [opened, setOpened] = useState(null);

  useEffect(() => {
    if (!isReady || !request.note) return;
    let isCurrent = true;
    openNote(request, { meId, isMine }).then(
      (text) => isCurrent && setOpened({ text }),
      () => isCurrent && setOpened({ isUnreadable: true })
    );
    return () => {
      isCurrent = false;
    };
  }, [isReady, request, meId, isMine]);

  if (!request.note) return null;
  if (!isReady) return <Quiet>Unlock your messages to read this note</Quiet>;
  if (opened?.isUnreadable) return <Quiet>This note can't be opened on this device</Quiet>;
  if (!opened) return null;

  return (
    <Box
      component="p"
      sx={{ ...bubbleShape(isMine), ...(!isMine && ON_ANY_SURFACE), m: 0, alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "min(100%, 52ch)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
    >
      <Box component="span" sx={SPOKEN_ONLY}>
        {isMine ? "Your message: " : `Message from ${request.person.firstName}: `}
      </Box>
      {opened.text}
    </Box>
  );
};

export default RequestNote;
