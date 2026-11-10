import { Box } from "@mui/material";
import { RobotIcon } from "@phosphor-icons/react";

import { personaOf } from "@/sections/chat/game/bots";

const BotFace = ({ seat, size, iconScale = 0.5 }) => {
  const persona = personaOf(seat);
  if (!persona) return <RobotIcon size={size * iconScale} weight="duotone" />;
  return <Box component="img" src={persona.face} alt="" draggable={false} sx={{ width: size, height: size, display: "block", background: persona.backdrop }} />;
};

export default BotFace;
