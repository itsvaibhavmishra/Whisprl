import { useEffect, useRef, useState } from "react";
import { Box, IconButton, InputBase, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { PaperPlaneTilt, Smiley } from "phosphor-react";
import { useDispatch } from "react-redux";

import { ReactToStatus, ReplyToStatus } from "@/redux/slices/actions/statusActions";
import uuidv4 from "@/utils/uuidv4";

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];
const MAX_REPLY = 1000;
const CHOSEN_SHOWN_MS = 700;
export const FOOTER_HEIGHT = 68;

const rise = keyframes`
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.6); }
  25% { opacity: 1; transform: translate(-50%, -24px) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -120px) scale(1); }
`;

// arrows and space pressed in a field or a sheet stay there, rather than moving or pausing the statuses behind it
export const keepKeys = (event) => (event.key.startsWith("Arrow") || event.key === " ") && event.stopPropagation();

const footerButton = { width: 44, height: 44, color: "#fff", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" } };

const ReactionsRow = ({ chosen, onReact }) => (
  <Stack direction="row" spacing={0.25} role="group" aria-label="React" sx={{ p: 0.5, borderRadius: 99, bgcolor: "rgba(16, 20, 28, 0.86)", backdropFilter: "blur(12px)" }}>
    {QUICK_REACTIONS.map((emoji) => (
      <IconButton
        key={emoji}
        aria-label={`React with ${emoji}`}
        aria-pressed={chosen === emoji}
        onClick={() => onReact(emoji)}
        sx={{
          width: 44,
          height: 44,
          fontSize: 24,
          transition: "transform 160ms ease, background-color 160ms ease",
          "&:hover": { transform: "scale(1.15)", bgcolor: "rgba(255, 255, 255, 0.14)" },
          "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
          ...(chosen === emoji && {
            boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}`,
            "&, &:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3) },
          }),
        }}
      >
        {emoji}
      </IconButton>
    ))}
  </Stack>
);

// a stranger's update for everyone takes reactions only, since chats are between friends
const ReplyBar = ({ status, canReply, isPicking, onPicking, onTyping }) => {
  const dispatch = useDispatch();
  const field = useRef(null);
  const [text, setText] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [sentReaction, setSentReaction] = useState(null);
  const [picked, setPicked] = useState(null);
  const closeTimer = useRef(null);
  const name = status.owner.firstName;

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const react = (emoji) => {
    dispatch(ReactToStatus({ status, emoji }));
    setSentReaction({ emoji, key: uuidv4() });
    setPicked(emoji);
    // the row stays a moment so the circle on the chosen emoji is seen before it goes
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onPicking(false), CHOSEN_SHOWN_MS);
  };

  const send = (event) => {
    event.preventDefault();
    const words = text.trim();
    if (!words) return;
    dispatch(ReplyToStatus({ status, text: words }));
    setText("");
    setIsSent(true);
    onPicking(false);
    field.current.blur();
  };

  return (
    <Box sx={{ position: "relative", height: FOOTER_HEIGHT, px: 1.5, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      {(isPicking || !canReply) && (
        <Box sx={{ position: canReply ? "absolute" : "static", bottom: FOOTER_HEIGHT - 4, left: "50%", transform: canReply ? "translateX(-50%)" : "none", zIndex: 4 }}>
          <ReactionsRow chosen={picked ?? status.myReaction} onReact={react} />
        </Box>
      )}
      {canReply && (
        <Box component="form" onSubmit={send} sx={{ width: "100%", display: "flex", alignItems: "center", gap: 0.5 }}>
          <InputBase
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setIsSent(false);
            }}
            inputRef={field}
            onKeyDown={keepKeys}
            onFocus={() => {
              onTyping(true);
              onPicking(true);
            }}
            onBlur={() => onTyping(false)}
            placeholder={isSent ? `Sent to ${name}` : `Reply to ${name}…`}
            inputProps={{ "aria-label": `Reply to ${name}`, maxLength: MAX_REPLY }}
            sx={{
              flex: 1,
              height: 44,
              px: 2,
              color: "inherit",
              fontSize: 14,
              borderRadius: 99,
              border: "1px solid rgba(255, 255, 255, 0.4)",
              transition: "border-color 160ms ease",
              "&.Mui-focused": { borderColor: "rgba(255, 255, 255, 0.85)" },
              "& input::placeholder": { color: "inherit", opacity: 0.7 },
            }}
          />
          {text.trim() ? (
            <IconButton type="submit" aria-label="Send reply" sx={footerButton}>
              <PaperPlaneTilt size={22} weight="fill" />
            </IconButton>
          ) : (
            <IconButton aria-label={isPicking ? "Hide reactions" : "React"} aria-expanded={isPicking} onClick={() => onPicking(!isPicking)} sx={footerButton}>
              <Smiley size={24} />
            </IconButton>
          )}
        </Box>
      )}
      {sentReaction && (
        <Typography key={sentReaction.key} aria-hidden sx={{ position: "absolute", left: "50%", bottom: FOOTER_HEIGHT + 40, zIndex: 5, fontSize: 64, pointerEvents: "none", animation: `${rise} 1200ms ease-out forwards`, "@media (prefers-reduced-motion: reduce)": { display: "none" } }}>
          {sentReaction.emoji}
        </Typography>
      )}
    </Box>
  );
};

export default ReplyBar;
