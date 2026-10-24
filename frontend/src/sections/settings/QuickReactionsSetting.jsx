import { useDispatch, useSelector } from "react-redux";

import QuickReactionSlots from "@/components/QuickReactionSlots";
import { UpdateQuickReactions } from "@/redux/slices/actions/userActions";
import { SettingRow } from "@/sections/settings/SettingsSection";
import { DEFAULT_QUICK_REACTIONS, quickReactionsOf } from "@/utils/reactions";

const QuickReactionsSetting = () => {
  const dispatch = useDispatch();
  const reactions = useSelector((state) => quickReactionsOf(state.user.user));
  const isDefault = reactions.join() === DEFAULT_QUICK_REACTIONS.join();

  return (
    <SettingRow
      label="Quick reactions"
      description="The six you see first when reacting. Double click or double tap a message to send the first one. A chat can override these from its own details."
    >
      <QuickReactionSlots
        reactions={reactions}
        onChange={(next) => dispatch(UpdateQuickReactions(next))}
        onReset={isDefault ? undefined : () => dispatch(UpdateQuickReactions(DEFAULT_QUICK_REACTIONS))}
      />
    </SettingRow>
  );
};

export default QuickReactionsSetting;
