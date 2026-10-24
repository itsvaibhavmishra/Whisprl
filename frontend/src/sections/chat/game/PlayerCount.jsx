import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { MinusIcon, PlusIcon } from "@phosphor-icons/react";

import { ON_SCRIM, ON_SCRIM_SOFT } from "@/sections/chat/game/scrim";
import { isTaken } from "@/sections/chat/game/seats";

const Rule = () => <Box sx={{ flex: 1, height: "1px", bgcolor: alpha("#fff", 0.28) }} />;

const Step = ({ label, onClick, children }) => (
  <IconButton
    aria-label={label}
    onClick={onClick}
    disabled={!onClick}
    size="small"
    sx={{
      p: 0.5,
      color: ON_SCRIM,
      border: `1.5px solid ${alpha("#fff", 0.38)}`,
      "&.Mui-disabled": { color: alpha("#fff", 0.3), borderColor: alpha("#fff", 0.16) },
    }}
  >
    {children}
  </IconButton>
);

// a bigger table is refused by the same rule that locks a board size, so the two always agree
const reasonAgainst = (game, session, count) =>
  (game.options ?? []).map((option) => option.unavailable?.(session.options?.[option.key], count)).find(Boolean) ?? null;

// how many play is the group manager's call, so only they see this
const PlayerCount = ({ game, session, onChange }) => {
  const count = session.seats.length;
  const { min, max } = session.players;
  const seated = session.seats.filter(isTaken).length;
  const reason = count < max ? reasonAgainst(game, session, count + 1) : null;

  return (
    <Stack spacing={0.4} sx={{ alignItems: "center", width: "100%" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
        <Rule />
        <Step label="One player fewer" onClick={count > min && count > seated ? () => onChange(count - 1) : null}>
          <MinusIcon size={13} weight="bold" />
        </Step>
        <Typography sx={{ minWidth: 70, textAlign: "center", fontSize: 13, fontWeight: 700, color: ON_SCRIM }}>{`${count} players`}</Typography>
        <Step label="One more player" onClick={count < max && !reason ? () => onChange(count + 1) : null}>
          <PlusIcon size={13} weight="bold" />
        </Step>
        <Rule />
      </Stack>
      {reason && <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: ON_SCRIM_SOFT }}>{`${reason} on this board`}</Typography>}
    </Stack>
  );
};

export default PlayerCount;
