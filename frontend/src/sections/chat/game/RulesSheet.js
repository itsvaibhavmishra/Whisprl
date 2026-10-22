import { Suspense, useEffect, useRef, useState } from "react";
import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import GameSheet from "@/sections/chat/game/GameSheet";

// the same for every game, so each game writes only what is its own and this is never out of step with the server
const turnsNote = (seconds) =>
  `You have ${seconds} seconds a turn. If the time runs out, the bot moves for you. Miss two turns in a row and it keeps playing your seat until you take it back.`;

const TurnClock = ({ seconds, theme }) => (
  <Box component="svg" viewBox="0 0 120 120" aria-hidden sx={{ height: "100%", maxWidth: "100%" }}>
    <circle cx="60" cy="60" r="44" fill="none" stroke={alpha(theme.ink, 0.15)} strokeWidth="10" />
    <circle
      cx="60"
      cy="60"
      r="44"
      fill="none"
      stroke={theme.accent}
      strokeWidth="10"
      strokeLinecap="round"
      strokeDasharray="276"
      strokeDashoffset="90"
      transform="rotate(-90 60 60)"
    />
    <text x="60" y="60" textAnchor="middle" dominantBaseline="central" fill={theme.ink} fontSize="26" fontWeight="800">
      {`${seconds}s`}
    </text>
  </Box>
);

const pictureOf = (rule, game) => {
  if (rule.seconds) return <TurnClock seconds={rule.seconds} theme={game.theme} />;
  if (!rule.picture || !game.RulesArt) return null;
  return (
    <Suspense fallback={null}>
      <game.RulesArt picture={rule.picture} />
    </Suspense>
  );
};

const Page = ({ rule, game }) => {
  const picture = pictureOf(rule, game);
  return (
    <Stack sx={{ flex: "0 0 100%", scrollSnapAlign: "start", px: 3, pb: 1, minWidth: 0 }}>
      {picture && <Box sx={{ height: { xs: 190, sm: 210 }, mb: 2.5, display: "grid", placeItems: "center", containerType: "size" }}>{picture}</Box>}
      <Typography sx={{ fontSize: 19, fontWeight: 800, color: game.theme.ink, mb: 1 }}>{rule.heading}</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: alpha(game.theme.ink, 0.82) }}>{rule.text}</Typography>
    </Stack>
  );
};

const RulesSheet = ({ game, turnSeconds, onClose }) => {
  const { theme } = game;
  const pagesRef = useRef(null);
  const [page, setPage] = useState(0);
  const pages = turnSeconds ? [...game.rules, { heading: "Turns", text: turnsNote(turnSeconds), seconds: turnSeconds }] : game.rules;
  const isLast = page === pages.length - 1;

  useEffect(() => {
    pagesRef.current?.focus();
  }, []);

  const goTo = (index) => {
    const pagesBox = pagesRef.current;
    pagesBox.scrollTo({ left: index * pagesBox.clientWidth, behavior: "smooth" });
  };

  return (
    <GameSheet theme={theme} title={`How to play ${game.name}`} onClose={onClose}>
      <Box
        ref={pagesRef}
        tabIndex={-1}
        onScroll={(event) => setPage(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
        sx={{
          display: "flex",
          overflowX: "auto",
          overflowY: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          outline: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {pages.map((rule) => (
          <Page key={rule.heading} rule={rule} game={game} />
        ))}
      </Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3, pt: 2 }}>
        <Stack direction="row" spacing={0.75} sx={{ flex: 1 }}>
          {pages.map((rule, index) => (
            <ButtonBase
              key={rule.heading}
              aria-label={`Page ${index + 1}: ${rule.heading}`}
              aria-current={index === page ? "step" : undefined}
              onClick={() => goTo(index)}
              sx={{
                width: index === page ? 20 : 8,
                height: 8,
                borderRadius: 99,
                bgcolor: index === page ? theme.accent : alpha(theme.ink, 0.25),
                transition: "width 200ms ease",
              }}
            />
          ))}
        </Stack>
        {page > 0 && (
          <Button onClick={() => goTo(page - 1)} sx={{ color: theme.ink, fontWeight: 700 }}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => (isLast ? onClose() : goTo(page + 1))}
          sx={{ borderRadius: 99, px: 2.5, fontWeight: 800, bgcolor: theme.accent, color: "#fff", "&:hover": { bgcolor: theme.accent } }}
        >
          {isLast ? "Got it" : "Next"}
        </Button>
      </Stack>
    </GameSheet>
  );
};

export default RulesSheet;
