import { Button, Stack } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { AnswerInvite } from "@/redux/slices/actions/gameActions";
import { selectGameSession } from "@/redux/slices/gameSlice";
import useChallenge from "@/sections/chat/conversation/useChallenge";

// what a Whisprl message offers to do next sits under it, apart from its words
const NoticeActions = ({ actions, conversation }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const meId = useSelector((state) => state.user.user._id);
  const session = useSelector(selectGameSession);
  const { challenge, picker } = useChallenge(conversation);
  // a challenge can be answered only while its seat is still saved, so once it is taken, turned down or the table closes the choice goes
  const isInvited = Boolean(session?.seats.some((seat) => seat.invited === meId));
  const shown = actions.filter((action) => !action.whileInvited || isInvited);
  if (!shown.length) return null;

  const runOf = (action) => {
    if (action.kind === "challenge") return challenge;
    if (action.kind === "accept" || action.kind === "decline")
      return () => dispatch(AnswerInvite({ conversationId: conversation._id, accept: action.kind === "accept" }));
    return () => navigate(action.to);
  };

  return (
    // close under its own bubble and clear of the next, so it reads as part of the message above
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 0.5, mb: 1.5 }}>
      {shown.map((action) => (
        <Button key={action.label} variant={action.kind === "accept" ? "contained" : "outlined"} size="small" onClick={runOf(action)} sx={{ borderRadius: 99 }}>
          {action.label}
        </Button>
      ))}
      {picker}
    </Stack>
  );
};

export default NoticeActions;
