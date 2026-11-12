import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckIcon, LockSimpleIcon } from "@phosphor-icons/react";

import { ON_SCRIM, ON_SCRIM_SOFT } from "@/sections/chat/game/scrim";
import usePending from "@/sections/chat/game/usePending";

// a chosen card reads as picked in any game's colours, so the colour that marks it belongs to the canvas
const PICKED = "#4A7BF7";
const PAPER = "#FBF4E8";
// the chosen card is always paper, so its text is always dark, whatever the game's own ink is
const PAPER_INK = "#2E2440";

const Heading = ({ children }) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
    <Box sx={{ flex: 1, height: "1px", bgcolor: alpha("#fff", 0.28) }} />
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: ON_SCRIM }}>{children}</Typography>
    <Box sx={{ flex: 1, height: "1px", bgcolor: alpha("#fff", 0.28) }} />
  </Stack>
);

const Choice = ({ option, choice, theme, isChosen, reason, onChoose }) => {
  const colour = (isChosen && PICKED) || (reason && alpha("#fff", 0.45)) || theme.accent;

  return (
    <Stack spacing={0.6} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
      <ButtonBase
        disabled={Boolean(reason) || !onChoose}
        onClick={onChoose}
        aria-label={`${choice.label}, ${choice.note}${reason ? `. ${reason}` : ""}`}
        aria-pressed={isChosen}
        sx={{
          position: "relative",
          width: "100%",
          flexDirection: "column",
          gap: 0.45,
          pt: 1,
          pb: 0.8,
          borderRadius: 3.5,
          color: isChosen ? PAPER_INK : ON_SCRIM,
          bgcolor: isChosen ? PAPER : alpha("#fff", 0.07),
          boxShadow: isChosen ? `0 0 0 2px ${PICKED}, 0 8px 20px rgba(0,0,0,0.28)` : `inset 0 0 0 1px ${alpha("#fff", 0.2)}`,
          transition: "background-color 160ms ease, box-shadow 160ms ease, color 160ms ease",
          "&.Mui-disabled": { color: isChosen ? PAPER_INK : alpha("#fff", 0.55) },
          "&:hover:not(.Mui-disabled)": { bgcolor: isChosen ? PAPER : alpha("#fff", 0.13) },
        }}
      >
        {isChosen && (
          <Box
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: PICKED,
              color: "#fff",
            }}
          >
            <CheckIcon size={11} weight="bold" />
          </Box>
        )}
        {reason && (
          <Box sx={{ position: "absolute", top: 7, right: 8, color: alpha("#fff", 0.55) }}>
            <LockSimpleIcon size={13} weight="fill" />
          </Box>
        )}
        {option.Preview && <option.Preview value={choice.value} colour={colour} />}
        <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{choice.label}</Typography>
        <Typography sx={{ fontSize: 10.5, fontWeight: 600, lineHeight: 1, color: isChosen ? alpha(PAPER_INK, 0.62) : "inherit", opacity: isChosen ? 1 : 0.75 }}>
          {choice.note}
        </Typography>
      </ButtonBase>
      {reason && <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: ON_SCRIM_SOFT, textAlign: "center", lineHeight: 1.2 }}>{reason}</Typography>}
    </Stack>
  );
};

const Setting = ({ option, theme, confirmed, players, canChange, onChange }) => {
  const [chosen, choose] = usePending(confirmed, (value) => onChange({ [option.key]: value }));

  return (
    <Stack spacing={1} sx={{ alignItems: "center" }}>
      <Heading>{option.label}</Heading>
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", width: "100%" }}>
        {option.choices.map((choice) => (
          <Choice
            key={choice.value}
            option={option}
            choice={choice}
            theme={theme}
            isChosen={choice.value === chosen}
            reason={option.unavailable?.(choice.value, players) ?? null}
            onChoose={canChange ? () => choose(choice.value) : null}
          />
        ))}
      </Stack>
    </Stack>
  );
};

// a choice with nothing to picture is a row of words, so it sits as one slim switch rather than a heading over cards
const Segmented = ({ option, theme, confirmed, players, canChange, onChange }) => {
  const [chosen, choose] = usePending(confirmed, (value) => onChange({ [option.key]: value }));
  const reasons = option.choices.map((choice) => option.unavailable?.(choice.value, players) ?? null);
  const shownReason = reasons.find(Boolean);

  return (
    <Stack spacing={0.5} sx={{ width: "100%", alignItems: "center" }}>
      <Stack
        role="radiogroup"
        aria-label={option.label}
        direction="row"
        sx={{
          width: "100%",
          p: "3px",
          borderRadius: 99,
          bgcolor: "rgba(0, 0, 0, 0.32)",
          boxShadow: `inset 0 0 0 1px ${alpha(theme.outline ?? "#fff", 0.32)}`,
        }}
      >
        {option.choices.map((choice, index) => {
          const isChosen = choice.value === chosen;
          return (
            <ButtonBase
              key={choice.value}
              role="radio"
              aria-checked={isChosen}
              aria-label={`${choice.label}, ${choice.note}${reasons[index] ? `. ${reasons[index]}` : ""}`}
              disabled={Boolean(reasons[index]) || !canChange}
              onClick={() => choose(choice.value)}
              sx={{
                flex: 1,
                minWidth: 0,
                height: 34,
                gap: 0.6,
                borderRadius: 99,
                fontSize: 13.5,
                fontWeight: 800,
                whiteSpace: "nowrap",
                color: isChosen ? (theme.onAccent ?? "#fff") : ON_SCRIM,
                bgcolor: isChosen ? theme.accent : "transparent",
                boxShadow: isChosen ? `0 4px 12px ${alpha(theme.accent, 0.45)}` : "none",
                transition: "background-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
                "&.Mui-disabled": { color: isChosen ? (theme.onAccent ?? "#fff") : alpha("#fff", 0.45) },
                "&:hover:not(.Mui-disabled)": { bgcolor: isChosen ? theme.accent : alpha("#fff", 0.08) },
              }}
            >
              {reasons[index] && <LockSimpleIcon size={12} weight="fill" />}
              {choice.label}
            </ButtonBase>
          );
        })}
      </Stack>
      {shownReason && (
        <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: ON_SCRIM_SOFT, textAlign: "center", lineHeight: 1.2 }}>{shownReason}</Typography>
      )}
    </Stack>
  );
};

// whatever settings a game declares, drawn the same way for every game; one that declares none shows nothing
const GameOptions = ({ game, session, isBetweenTwo, canChange, onChange, onSwitchMode }) => {
  // a setting about the other person means nothing in a group or a chat with yourself
  const shown = game.options?.filter((option) => isBetweenTwo || !option.isBetweenTwoOnly) ?? [];
  if (!shown.length && !game.modes) return null;

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {game.modes && (
        <Segmented
          option={{ key: "game", label: "Mode", choices: game.modes }}
          theme={game.theme}
          confirmed={game.id}
          players={session.seats.length}
          canChange={canChange}
          onChange={({ game: chosen }) => onSwitchMode(chosen)}
        />
      )}
      {shown.map((option) => {
        const Look = option.Preview ? Setting : Segmented;
        return (
          <Look
            key={option.key}
            option={option}
            theme={game.theme}
            confirmed={session.options?.[option.key]}
            players={session.seats.length}
            canChange={canChange}
            onChange={onChange}
          />
        );
      })}
    </Stack>
  );
};

export default GameOptions;
