import { useState } from "react";
import { ButtonBase, Typography } from "@mui/material";
import { NumberCircleOne } from "phosphor-react";

import ViewOnceViewer from "@/sections/chat/messages/ViewOnceViewer";

const ViewOnceMessage = ({ message, isMine, isGroup, meId }) => {
  const [isViewing, setIsViewing] = useState(false);
  const viewers = message.viewedBy ?? [];
  const hasOpened = viewers.includes(meId) || message.attachment?.status === "opened";
  const canOpen = !isMine && !hasOpened && Boolean(message.file) && message.attachment?.status === "ready";
  const noun = message.file?.kind === "video" ? "Video" : "Photo";

  const label = () => {
    if (isMine) {
      if (!viewers.length) return noun;
      return isGroup ? `Opened by ${viewers.length}` : "Opened";
    }
    if (hasOpened) return "Opened";
    return canOpen ? noun : `${noun} on its way`;
  };

  return (
    <>
      <ButtonBase
        disabled={!canOpen}
        onClick={() => setIsViewing(true)}
        aria-label={canOpen ? `Open view once ${noun.toLowerCase()}` : `View once ${noun.toLowerCase()}, ${label().toLowerCase()}`}
        sx={{ gap: 1, px: 0.5, py: 0.25, borderRadius: 1, color: "inherit", justifyContent: "flex-start" }}
      >
        <NumberCircleOne size={22} weight={canOpen ? "fill" : "regular"} />
        <Typography variant="body2" sx={{ fontWeight: 600, fontStyle: canOpen ? "normal" : "italic", opacity: canOpen ? 1 : 0.8 }}>
          {label()}
        </Typography>
      </ButtonBase>
      {isViewing && <ViewOnceViewer message={message} onClose={() => setIsViewing(false)} />}
    </>
  );
};

export default ViewOnceMessage;
