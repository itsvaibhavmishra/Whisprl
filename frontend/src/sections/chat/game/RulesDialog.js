import { Box, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import ClosableTitle from "@/sections/chat/game/ClosableTitle";

// the same for every game, so each game writes only what is its own and this is never out of step with the server
const turnsNote = (seconds) =>
  `You have ${seconds} seconds a turn. If the time runs out, the bot moves for you. Miss two turns in a row and it keeps playing your seat until you take it back.`;

const Section = ({ heading, text, accent }) => (
  <Stack direction="row" spacing={1.5}>
    <Box sx={{ width: 4, flexShrink: 0, borderRadius: 99, bgcolor: alpha(accent, 0.7) }} />
    <Box>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 0.25 }}>{heading}</Typography>
      <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: "text.secondary" }}>{text}</Typography>
    </Box>
  </Stack>
);

const RulesDialog = ({ game, turnSeconds, onClose }) => (
  <Dialog open onClose={onClose} fullWidth maxWidth="xs">
    <ClosableTitle title={`How to play ${game.name}`} onClose={onClose} />
    <DialogContent>
      <Stack spacing={2}>
        {game.rules.map((rule) => (
          <Section key={rule.heading} heading={rule.heading} text={rule.text} accent={game.theme.accent} />
        ))}
        {turnSeconds && <Section heading="Turns" text={turnsNote(turnSeconds)} accent={game.theme.accent} />}
      </Stack>
    </DialogContent>
  </Dialog>
);

export default RulesDialog;
