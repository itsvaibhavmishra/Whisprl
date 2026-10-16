import { useDispatch, useSelector } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import { SwitchSeat } from "@/redux/slices/actions/gameActions";
import { seatSwitchClosed } from "@/redux/slices/gameSlice";
import { GAMES } from "@/sections/chat/game/catalog";
import { identityOf } from "@/utils/chats";

// a person plays one game at a time, so sitting here means choosing to leave the other one to a bot
const SeatSwitchDialog = () => {
  const dispatch = useDispatch();
  const seatSwitch = useSelector((state) => state.game.seatSwitch);
  const conversations = useSelector((state) => state.chat.conversations);
  const meId = useSelector((state) => state.user.user._id);
  if (!seatSwitch) return null;

  const { elsewhere } = seatSwitch;
  const conversation = conversations.find((listed) => listed._id === elsewhere.conversationId);
  const where = conversation ? ` in ${identityOf(conversation, meId).name}` : "";

  return (
    <ConfirmDialog
      title="Leave your other game?"
      text={`You're playing ${GAMES[elsewhere.game]?.name ?? "a game"}${where}. Leaving hands your seat there to a bot.`}
      action="Leave and sit here"
      onConfirm={() => dispatch(SwitchSeat(seatSwitch))}
      onClose={() => dispatch(seatSwitchClosed())}
    />
  );
};

export default SeatSwitchDialog;
