import { useEffect } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { m, useReducedMotion } from "motion/react";
import { GameControllerIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetLeaderboard } from "@/redux/slices/actions/gameActions";
import GameSheet from "@/sections/chat/game/GameSheet";
import { PRACTICE_NOTE } from "@/sections/chat/game/gameStatus";
import { rivalColoursOf, standingsOf } from "@/sections/chat/game/standings";
import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

// the podium reads left to right as second, first, third, and each step's height says which it is
const PODIUM = [
  { index: 1, height: 52, delay: 0.12 },
  { index: 0, height: 72, delay: 0 },
  { index: 2, height: 38, delay: 0.22 },
];

const Person = ({ conversation, row, meId, size, theme }) => {
  const member = memberOf(conversation, row.user);
  return (
    <Stack spacing={0.5} sx={{ alignItems: "center", minWidth: 0, maxWidth: "100%" }}>
      {getAvatar(member?.avatar, member?.firstName, size)}
      <Typography noWrap sx={{ maxWidth: "100%", fontSize: 14, fontWeight: 800, color: theme.ink }}>
        {firstNameIn(conversation, row.user, meId)}
      </Typography>
    </Stack>
  );
};

const countOf = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

const HeadToHead = ({ game, conversation, standings, meId }) => {
  const { theme } = game;
  const [first, second] = standings;
  const decided = first.won + second.won;
  const colours = rivalColoursOf(theme.marks);
  const footnote = [first.drawn > 0 && countOf(first.drawn, "draw"), countOf(first.played, "game")].filter(Boolean);

  return (
    <Stack spacing={2} sx={{ px: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)", alignItems: "end", columnGap: 1 }}>
        {standings.map((row, index) => (
          <Stack key={row.user} spacing={1} sx={{ alignItems: "center", gridColumn: index === 0 ? 1 : 3, minWidth: 0 }}>
            <Person conversation={conversation} row={row} meId={meId} size={52} theme={theme} />
            <Typography sx={{ fontSize: 40, lineHeight: 1, fontWeight: 900, color: colours[index], fontVariantNumeric: "tabular-nums" }}>{row.won}</Typography>
          </Stack>
        ))}
        <Typography sx={{ gridColumn: 2, gridRow: 1, pb: 1, fontSize: 13, fontWeight: 800, color: alpha(theme.ink, 0.5) }}>vs</Typography>
      </Box>
      <Box sx={{ height: 8, display: "flex", borderRadius: 99, overflow: "hidden", bgcolor: alpha(theme.ink, 0.15) }}>
        {standings.map((row, index) => (
          <Box key={row.user} sx={{ width: `${decided ? (row.won / decided) * 100 : 50}%`, bgcolor: colours[index] }} />
        ))}
      </Box>
      <Typography sx={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: alpha(theme.ink, 0.65) }}>{footnote.join(", ")}</Typography>
    </Stack>
  );
};

const Podium = ({ game, conversation, standings, meId }) => {
  const { theme } = game;
  const isStill = useReducedMotion();
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end", px: 3 }}>
      {PODIUM.map(({ index, height, delay }) => {
        const row = standings[index];
        return (
          <Stack key={row.user} spacing={0.75} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
            <Person conversation={conversation} row={row} meId={meId} size={row.place === 1 ? 44 : 36} theme={theme} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: alpha(theme.ink, 0.7) }}>{countOf(row.won, "win")}</Typography>
            <Box
              component={m.div}
              initial={isStill ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={isStill ? { duration: 0 } : { duration: 0.4, ease: [0.32, 0.72, 0, 1], delay }}
              sx={{
                width: "100%",
                height,
                display: "grid",
                placeItems: "center",
                transformOrigin: "bottom",
                borderRadius: "12px 12px 4px 4px",
                bgcolor: alpha(theme.accent, row.place === 1 ? 0.32 : 0.18),
              }}
            >
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: theme.ink }}>{row.place}</Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
};

const STATS = [
  { key: "won", label: "Won" },
  { key: "drawn", label: "Drawn" },
  { key: "lost", label: "Lost" },
];

const Standings = ({ game, conversation, standings, meId }) => {
  const { theme } = game;
  // a game that cannot be drawn, or never has been here, gives draws no column
  const stats = STATS.filter(({ key }) => key !== "drawn" || standings.some((row) => row.drawn > 0));
  const columns = `24px minmax(0, 1fr) repeat(${stats.length}, 44px)`;
  const cell = { fontSize: 14, fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" };

  return (
    <Stack sx={{ px: 2 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: columns, columnGap: 1, px: 1, pb: 0.75, color: alpha(theme.ink, 0.55) }}>
        <Box sx={{ gridColumn: "span 2" }} />
        {stats.map(({ key, label }) => (
          <Typography key={key} sx={{ ...cell, fontSize: 11, fontWeight: 800 }}>
            {label}
          </Typography>
        ))}
      </Box>
      {standings.map((row) => {
        const member = memberOf(conversation, row.user);
        const isMe = row.user === meId;
        return (
          <Box
            key={row.user}
            sx={{
              display: "grid",
              gridTemplateColumns: columns,
              columnGap: 1,
              alignItems: "center",
              px: 1,
              py: 0.75,
              borderRadius: 3,
              color: theme.ink,
              bgcolor: isMe ? alpha(theme.accent, 0.14) : "transparent",
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: alpha(theme.ink, 0.6) }}>{row.place}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
              {getAvatar(member?.avatar, member?.firstName, 28)}
              <Typography noWrap sx={{ fontSize: 14, fontWeight: isMe ? 800 : 600 }}>
                {firstNameIn(conversation, row.user, meId)}
              </Typography>
            </Stack>
            {stats.map(({ key }) => (
              <Typography key={key} sx={{ ...cell, fontWeight: key === "won" ? 900 : 600 }}>
                {row[key]}
              </Typography>
            ))}
          </Box>
        );
      })}
    </Stack>
  );
};

const NoScores = ({ game }) => (
  <Stack spacing={1.25} sx={{ alignItems: "center", px: 3, py: 2, textAlign: "center" }}>
    <GameControllerIcon size={56} weight="duotone" color={game.theme.accent} />
    <Typography sx={{ fontSize: 17, fontWeight: 800, color: game.theme.ink }}>No games finished here yet</Typography>
    <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: alpha(game.theme.ink, 0.7) }}>
      {`Finish a game of ${game.name} against someone in this chat and the scores start. ${PRACTICE_NOTE}.`}
    </Typography>
  </Stack>
);

const Scores = (props) => {
  if (!props.standings.length) return <NoScores game={props.game} />;
  if (props.standings.length === 2) return <HeadToHead {...props} />;
  return (
    <Stack spacing={2.5}>
      <Podium {...props} />
      <Standings {...props} />
    </Stack>
  );
};

// only this game's scores in this chat, in the game's own colours
const ScoresSheet = ({ conversation, game, onClose }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const leaderboard = useSelector((state) => state.game.leaderboard);
  const isLoading = useIsLoading(GetLeaderboard);
  const isLoaded = leaderboard?.conversationId === conversation._id;

  useEffect(() => {
    dispatch(GetLeaderboard(conversation._id));
  }, [dispatch, conversation._id]);

  return (
    <GameSheet theme={game.theme} title={`${game.name} leaderboard`} onClose={onClose}>
      <Box sx={{ minHeight: 0, overflowY: "auto", pt: 1, pb: 1.5 }}>
        {isLoaded ? (
          <Scores standings={standingsOf(leaderboard.rows, game.id)} game={game} conversation={conversation} meId={meId} />
        ) : (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>{isLoading && <CircularProgress size={26} sx={{ color: game.theme.accent }} />}</Box>
        )}
      </Box>
    </GameSheet>
  );
};

export default ScoresSheet;
