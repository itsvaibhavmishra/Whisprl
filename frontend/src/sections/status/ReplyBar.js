import { useRef, useState } from "react";
import { Box, IconButton, InputBase, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { PaperPlaneTilt } from "phosphor-react";
import { useDispatch } from "react-redux";

import { ReactToStatus, ReplyToStatus } from "@/redux/slices/actions/statusActions";
import uuidv4 from "@/utils/uuidv4";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];
const MAX_REPLY = 1000;

const rise = keyframes`
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.6); }
  25% { opacity: 1; transform: translate(-50%, -24px) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -120px) scale(1); }
`;

// arrow keys pressed in a field or a sheet stay there, rather than moving the statuses behind it
export const keepArrows = (event) => event.key.startsWith("Arrow") && event.stopPropagation();

const ReplyBar = ({ status, onTyping }) => {
  const dispatch = useDispatch();
  const field = useRef(null);
  const [text, setText] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [sentReaction, setSentReaction] = useState(null);
  const name = status.owner.firstName;

  const react = (emoji) => {
    dispatch(ReactToStatus({ status, emoji }));
    setSentReaction({ emoji, key: uuidv4() });
  };

  const send = (event) => {
    event.preventDefault();
    const words = text.trim();
    if (!words) return;
    dispatch(ReplyToStatus({ status, text: words }));
    setText("");
    setIsSent(true);
    field.current.blur();
  };

  return (
    <Stack spacing={1} sx={{ px: 1.5, pt: 1, pb: 1.5, color: "#fff" }}>
      <Stack direction="row" justifyContent="center" spacing={0.5} role="group" aria-label="React">
        {QUICK_REACTIONS.map((emoji) => (
          <IconButton
            key={emoji}
            aria-label={`React with ${emoji}`}
            aria-pressed={status.myReaction === emoji}
            onClick={() => react(emoji)}
            sx={{ fontSize: 24, width: 44, height: 44, bgcolor: status.myReaction === emoji ? "rgba(255, 255, 255, 0.22)" : "transparent" }}
          >
            {emoji}
          </IconButton>
        ))}
      </Stack>
      <Box component="form" onSubmit={send} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <InputBase
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setIsSent(false);
          }}
          inputRef={field}
          onKeyDown={keepArrows}
          onFocus={() => onTyping(true)}
          onBlur={() => onTyping(false)}
          placeholder={isSent ? `Sent to ${name}` : `Reply to ${name}…`}
          inputProps={{ "aria-label": `Reply to ${name}`, maxLength: MAX_REPLY }}
          sx={{ flex: 1, color: "inherit", px: 2, py: 1, borderRadius: 99, border: "1px solid rgba(255, 255, 255, 0.45)", "& input::placeholder": { color: "inherit", opacity: 0.7 } }}
        />
        <IconButton type="submit" aria-label="Send reply" disabled={!text.trim()} sx={{ color: "inherit", "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.35)" } }}>
          <PaperPlaneTilt size={22} weight="fill" />
        </IconButton>
      </Box>
      {sentReaction && (
        <Typography key={sentReaction.key} aria-hidden sx={{ position: "absolute", left: "50%", bottom: 120, zIndex: 4, fontSize: 64, pointerEvents: "none", animation: `${rise} 1200ms ease-out forwards` }}>
          {sentReaction.emoji}
        </Typography>
      )}
    </Stack>
  );
};

export default ReplyBar;
