import { RobotIcon } from "@phosphor-icons/react";

// the one place the bot is named and drawn, so changing either changes it in every game
export const BOT_NAME = "Whisprl Bot";

const BotFace = ({ size }) => <RobotIcon size={size} weight="duotone" />;

export default BotFace;
