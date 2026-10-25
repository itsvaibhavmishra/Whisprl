import { useEffect, useState } from "react";
import { Box, ButtonBase, CircularProgress, Collapse, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetLeaderboard } from "@/redux/slices/actions/gameActions";
import GameTitle from "@/sections/chat/game/GameTitle";
import { Scores } from "@/sections/chat/game/ScoresSheet";
import { GAMES, GAME_IDS } from "@/sections/chat/game/catalog";
import { standingsOf } from "@/sections/chat/game/standings";
import useArtReady from "@/sections/chat/game/useArtReady";
import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

const BANNER_HEIGHT = 76;
const TITLE_HEIGHT = 56;
const BAR_THICKNESS = 14;
// the room each bar leaves at its tip for the count written there
const COUNT_ROOM = 40;

const totalsOf = (rows, played, meId) => {
  const people = new Map();
  rows.forEach((row) => {
    const person = people.get(row.user) ?? { user: row.user, won: 0, games: [] };
    person.won += row.won;
    person.games.push({ id: row.game, won: row.won });
    people.set(row.user, person);
  });
  return [...people.values()]
    .map((person) => ({ ...person, games: played.map((id) => person.games.find((game) => game.id === id) ?? { id, won: 0 }) }))
    .sort((one, other) => other.won - one.won || Number(other.user === meId) - Number(one.user === meId));
};

const NAME_COLUMN = 120;

const Breakdown = ({ games }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "max-content max-content",
      columnGap: 2,
      rowGap: 0.25,
      pt: 0.75,
      pl: `calc(${NAME_COLUMN}px + 12px)`,
      fontSize: 13,
      color: "text.secondary",
    }}
  >
    {games.map(({ id, won }) => (
      <Box key={id} sx={{ display: "contents" }}>
        <span>{GAMES[id].name}</span>
        <Box component="span" sx={{ textAlign: "right", fontWeight: 700, color: "text.primary" }}>
          {won}
        </Box>
      </Box>
    ))}
  </Box>
);

// one bar a person, so who is ahead overall reads at a glance; a tap on a bar opens which games its wins came from
const OverallWins = ({ rows, played, conversation, meId }) => {
  const [openUser, setOpenUser] = useState(null);
  const people = totalsOf(rows, played, meId);
  const most = Math.max(1, ...people.map((person) => person.won));

  return (
    <Box component="section" aria-label="Wins across all games">
      <Typography sx={{ mb: 1.5, fontSize: 15, fontWeight: 800 }}>Wins across all games</Typography>
      <Stack spacing={1.25}>
        {people.map((person) => {
          const member = memberOf(conversation, person.user);
          const name = firstNameIn(conversation, person.user, meId);
          const isMe = person.user === meId;
          const isOpen = openUser === person.user;
          return (
            <Box key={person.user}>
              <ButtonBase
                onClick={() => setOpenUser(isOpen ? null : person.user)}
                aria-expanded={isOpen}
                aria-label={`${name}: ${person.won} ${person.won === 1 ? "win" : "wins"}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: `minmax(0, ${NAME_COLUMN}px) minmax(0, 1fr)`,
                  columnGap: 1.5,
                  alignItems: "center",
                  width: "100%",
                  borderRadius: 2,
                  textAlign: "left",
                  "&.Mui-focusVisible": { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}` },
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                  {getAvatar(member?.avatar, member?.firstName, 28)}
                  <Typography noWrap sx={{ fontSize: 14, fontWeight: isMe ? 800 : 600 }}>
                    {name}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Box
                    sx={{
                      width: `calc((100% - ${COUNT_ROOM}px) * ${person.won / most})`,
                      minWidth: person.won ? 6 : 0,
                      height: BAR_THICKNESS,
                      borderRadius: "0 4px 4px 0",
                      bgcolor: isMe ? "primary.main" : "grey.500",
                      transition: "width 400ms cubic-bezier(0.32, 0.72, 0, 1)",
                    }}
                  />
                  <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{person.won}</Typography>
                </Stack>
              </ButtonBase>
              <Collapse in={isOpen}>
                <Breakdown games={person.games} />
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};

const summaryOf = (standings, conversation, meId) => {
  const [first, second] = standings;
  const leader = firstNameIn(conversation, first.user, meId);
  const lead = first.user === meId ? "lead" : "leads";
  if (standings.length === 2) return first.place === second.place ? `Level at ${first.won}–${second.won}` : `${leader} ${lead} ${first.won}–${second.won}`;
  return first.place === second.place ? `Level on ${first.won} wins` : `${leader} ${lead} with ${first.won}`;
};

// the game's own scene is the header, so the list reads as the games themselves; opening one shows its head to head
const GameScores = ({ game, rows, conversation, meId, isOpen, onToggle }) => {
  const { theme } = game;
  const isArtReady = useArtReady([game.art.scene, ...game.title.words.map(({ src }) => src)]);
  const standings = standingsOf(rows, game.id, meId);
  const panelId = `scores-${game.id}`;

  return (
    <Box
      component="section"
      aria-label={`${game.name} scores`}
      sx={{ borderRadius: 4, overflow: "hidden", background: `linear-gradient(${theme.card}, ${theme.card}), ${theme.surface}` }}
    >
      <ButtonBase
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          height: BANNER_HEIGHT,
          bgcolor: theme.surface,
          "&.Mui-focusVisible": { outline: `3px solid ${theme.accent}`, outlineOffset: -3 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${game.art.scene})`,
            backgroundSize: "cover",
            backgroundPosition: "center 14%",
            opacity: isArtReady ? 1 : 0,
            transition: "opacity 300ms ease",
          }}
        />
        <Box sx={{ position: "absolute", left: 14, top: (BANNER_HEIGHT - TITLE_HEIGHT) / 2 }}>
          <GameTitle title={game.title} name={game.name} width={Math.min(TITLE_HEIGHT * game.title.ratio, 150)} isStatic isReady={isArtReady} />
        </Box>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            maxWidth: "52%",
            pl: 1.25,
            pr: 1,
            py: 0.5,
            borderRadius: 99,
            color: "#fff",
            bgcolor: "rgba(10, 8, 26, 0.66)",
          }}
        >
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
            {summaryOf(standings, conversation, meId)}
          </Typography>
          <Box component="span" sx={{ display: "flex", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }}>
            <CaretDownIcon size={16} weight="bold" />
          </Box>
        </Stack>
      </ButtonBase>
      <Collapse in={isOpen} unmountOnExit>
        <Box id={panelId} sx={{ pt: 2.5, pb: 2, boxShadow: `inset 0 1px 0 ${alpha(theme.ink, 0.08)}` }}>
          <Scores standings={standings} game={game} conversation={conversation} meId={meId} />
        </Box>
      </Collapse>
    </Box>
  );
};

const Leaderboard = ({ conversation }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const leaderboard = useSelector((state) => state.game.leaderboard);
  const isLoading = useIsLoading(GetLeaderboard);
  const [openGames, setOpenGames] = useState([]);
  const rows = leaderboard?.conversationId === conversation._id ? leaderboard.rows : null;

  useEffect(() => {
    dispatch(GetLeaderboard(conversation._id));
  }, [dispatch, conversation._id]);

  if (!rows) {
    return <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>{isLoading && <CircularProgress size={24} />}</Box>;
  }
  const played = GAME_IDS.filter((id) => rows.some((row) => row.game === id));
  if (!played.length) {
    return (
      <Typography sx={{ px: 3, py: 4, textAlign: "center", color: "text.secondary" }}>
        No games finished here yet. Scores show up after the first one.
      </Typography>
    );
  }
  const toggle = (id) => setOpenGames((open) => (open.includes(id) ? open.filter((openId) => openId !== id) : [...open, id]));

  return (
    <Stack spacing={3} sx={{ px: 3, pt: 2.5, pb: 3, width: "100%", maxWidth: 640, mx: "auto" }}>
      <OverallWins rows={rows} played={played} conversation={conversation} meId={meId} />
      <Stack spacing={1.5}>
        {played.map((id) => (
          <GameScores
            key={id}
            game={GAMES[id]}
            rows={rows}
            conversation={conversation}
            meId={meId}
            isOpen={openGames.includes(id)}
            onToggle={() => toggle(id)}
          />
        ))}
      </Stack>
    </Stack>
  );
};

export default Leaderboard;
