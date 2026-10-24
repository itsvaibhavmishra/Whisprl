import { Robot } from "phosphor-react";

// the one place the bot is named and drawn, so changing either changes it in every game
export const BOT_NAME = "Whisprl Bot";

const BotFace = ({ size }) => <Robot size={size} weight="duotone" />;

export default BotFace;
