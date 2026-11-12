import { Box, Stack } from "@mui/material";

import art, { boardArtOf } from "@/sections/chat/game/games/jackaroo/art";
import CardFace from "@/sections/chat/game/games/jackaroo/CardFace";
import { BOARD, centredAt, pointOf, SPRITES, viewOf } from "@/sections/chat/game/games/jackaroo/geometry";
import { ModeContext } from "@/sections/chat/game/games/jackaroo/mode";
import { Cross, Marks, ShutHome, Swirls, shutHolesOf } from "@/sections/chat/game/games/jackaroo/Pieces";

// seats, from the bottom one round the table
const YOU = 0;
const THEM = 1;
const PARTNER = 2;
const SECOND_OPPONENT = 3;
// you play blue from the bottom against red, as the design's screens show it; two against two your partner is green and the other opponent purple
const TONES = { single: [4, 0], teams: [4, 0, 2, 5] };
const CARD_TONES = { mine: 4, theirs: 0 };
const MAROON = "#8c1a1d";

const track = (index) => ({ at: "track", index });
const home = (slot) => ({ at: "home", slot });
const base = (slot) => ({ at: "base", slot });
const card = (rank, suit) => ({ id: `rules-${rank}${suit}`, rank, suit });

// each picture: the part of the board it looks at, in board units, what stands on it, and the move it shows
const SCENES = {
  aim: {
    crop: { x: 0, y: 0, width: 1000, height: 1000 },
    marbles: [
      [home(3), YOU],
      [home(2), YOU],
      [home(1), YOU],
      [track(44), YOU],
      [track(9), THEM],
      [track(30), THEM],
    ],
    arrow: [track(44), home(0)],
  },
  out: {
    crop: { x: 220, y: 600, width: 300, height: 215 },
    marbles: [
      [base(1), YOU],
      [base(2), YOU],
      [base(3), YOU],
      [track(0), YOU],
    ],
    arrow: [base(0), track(0)],
  },
  moving: {
    crop: { x: 225, y: 380, width: 230, height: 300 },
    marbles: [
      [track(4), YOU],
      [track(7), THEM],
    ],
    ghost: track(10),
    arrow: [track(4), track(10)],
    card: card(6, "S"),
  },
  knockout: {
    crop: { x: 225, y: 380, width: 230, height: 300 },
    marbles: [
      [track(4), YOU],
      [track(9), THEM],
    ],
    arrow: [track(4), track(9)],
    knockout: [track(9), THEM],
  },
  swirls: {
    crop: { x: 360, y: 545, width: 280, height: 175 },
    marbles: [[track(4), YOU]],
    ghost: track(40),
  },
  home: {
    crop: { x: 380, y: 585, width: 240, height: 230 },
    marbles: [
      [home(3), YOU],
      [home(2), YOU],
      [track(45), YOU],
    ],
    // along the marble's own way: onto the hole in front of home, then up into it
    arrow: [track(45), home(1), YOU, [track(46), home(0)]],
  },
  shut: {
    crop: { x: 380, y: 585, width: 240, height: 230 },
    marbles: [
      [home(3), YOU],
      [track(46), THEM],
      [track(43), YOU],
    ],
    shut: true,
  },
};

// two against two, on the four-armed board: your arm is at the bottom, your partner's at the top
const TEAM_SCENES = {
  aim: {
    crop: { x: 0, y: 0, width: 1000, height: 1000 },
    marbles: [
      [home(3), YOU],
      [home(2), YOU],
      [home(1), YOU],
      [track(63), YOU],
      [home(3), PARTNER],
      [home(2), PARTNER],
      [home(1), PARTNER],
      [home(0), PARTNER],
      [track(25), THEM],
      [track(48), SECOND_OPPONENT],
    ],
    arrow: [track(63), home(0), YOU],
  },
  teams: {
    crop: { x: 0, y: 0, width: 1000, height: 1000 },
    // every seat's marbles in its base, as a team game starts
    marbles: [YOU, THEM, PARTNER, SECOND_OPPONENT].flatMap((seat) => [0, 1, 2, 3].map((slot) => [base(slot), seat])),
  },
  out: {
    crop: { x: 180, y: 660, width: 300, height: 240 },
    marbles: [
      [base(1), YOU],
      [base(2), YOU],
      [base(3), YOU],
    ],
    arrow: [base(0), track(0), YOU],
    ghost: track(0),
  },
  moving: {
    crop: { x: 280, y: 580, width: 200, height: 260 },
    marbles: [
      [track(2), YOU],
      [track(5), THEM],
    ],
    ghost: track(8),
    arrow: [track(2), track(8), YOU],
    card: card(6, "S"),
  },
  knockout: {
    crop: { x: 280, y: 580, width: 200, height: 260 },
    marbles: [
      [track(1), YOU],
      [track(7), THEM],
    ],
    arrow: [track(1), track(7), YOU],
    knockout: [track(7), THEM],
  },
  home: {
    crop: { x: 400, y: 680, width: 220, height: 220 },
    marbles: [
      [home(3), YOU],
      [home(2), YOU],
      [track(72), YOU],
    ],
    arrow: [track(72), home(1), YOU, [track(74), home(0)]],
  },
  partner: {
    crop: { x: 0, y: 0, width: 1000, height: 1000 },
    marbles: [
      [home(3), YOU],
      [home(2), YOU],
      [home(1), YOU],
      [home(0), YOU],
      [track(30), PARTNER],
      [track(10), THEM],
      [track(62), SECOND_OPPONENT],
    ],
    arrow: [track(30), track(35), PARTNER],
  },
};

const HAND = [card(1, "C"), card(6, "S"), card(7, "H"), card(12, "D")];
const SPECIALS = [card(4, "S"), card(7, "H"), card(10, "C"), card(11, "S"), card(13, "S")];
const TEAM_SPECIALS = [card(1, "C"), card(5, "S"), card(10, "C"), card(11, "H"), card(13, "S")];

const sprite = { position: "absolute", display: "block", pointerEvents: "none" };
// every picture is a crop of its game's own board, seen from the bottom seat
const VIEWS = { single: viewOf("single", 0), teams: viewOf("teams", 0) };

const Marble = ({ place, seat, mode, isGhost = false }) => (
  <Box
    component="img"
    alt=""
    src={art.marble(TONES[mode][seat])}
    sx={{
      ...sprite,
      ...centredAt(pointOf(place, seat, VIEWS[mode]), SPRITES.marble),
      opacity: isGhost ? 0.55 : 1,
      filter: "drop-shadow(0 2px 2px rgba(40, 18, 4, 0.5))",
    }}
  />
);

const unit = (from, to) => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

// a bold maroon arrow edged in cream: bent toward the open middle, or along the holes it passes when the move turns a corner
const Arrow = ({ from, to, seat, via = [], crop, view }) => {
  const start = pointOf(from, seat, view);
  const end = pointOf(to, seat, view);
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const inward = unit(middle, view.layout.pile);
  const straight = Math.hypot(end.x - start.x, end.y - start.y);
  const corners = via.map((place) => pointOf(place, seat, view));
  const points = [start, ...corners, end];
  const length = points.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
  // sized to the window, but never so big a short arrow is all head
  const width = Math.min(crop.width * 0.024, length * 0.09);
  const head = Math.min(crop.width * 0.075, length * 0.3);
  // the arrow leaves and reaches each marble at its edge, so neither is hidden under it
  const reach = SPRITES.marble * 0.6;
  const bend = { x: middle.x + inward.x * straight * 0.3, y: middle.y + inward.y * straight * 0.3 };
  const leaving = unit(start, corners[0] ?? bend);
  const arriving = unit(corners.at(-1) ?? bend, end);
  const from_ = { x: start.x + leaving.x * reach, y: start.y + leaving.y * reach };
  // a routed arrow ends in the empty hole it names, so its head points into that hole rather than short of it
  const arrival = corners.length ? SPRITES.marble * 0.1 : reach;
  const tip = { x: end.x - arriving.x * arrival, y: end.y - arriving.y * arrival };
  const neck = { x: tip.x - arriving.x * head * 0.7, y: tip.y - arriving.y * head * 0.7 };
  const arrive = Math.atan2(arriving.y, arriving.x);
  const barb = (side) => `${tip.x - Math.cos(arrive + side * 0.55) * head},${tip.y - Math.sin(arrive + side * 0.55) * head}`;
  // each corner is rounded off over a short stretch either side of its hole
  const turns = corners.map((corner, index) => {
    const before = index === 0 ? from_ : corners[index - 1];
    const after = corners[index + 1] ?? neck;
    const into = unit(before, corner);
    const out = unit(corner, after);
    const round = Math.min(18, Math.hypot(corner.x - before.x, corner.y - before.y) / 2, Math.hypot(after.x - corner.x, after.y - corner.y) / 2);
    return `L${corner.x - into.x * round} ${corner.y - into.y * round} Q${corner.x} ${corner.y} ${corner.x + out.x * round} ${corner.y + out.y * round}`;
  });
  const curve = corners.length
    ? `M${from_.x} ${from_.y} ${turns.join(" ")} L${neck.x} ${neck.y}`
    : `M${from_.x} ${from_.y} Q${bend.x} ${bend.y} ${neck.x} ${neck.y}`;
  const point = `${tip.x},${tip.y} ${barb(1)} ${barb(-1)}`;
  return (
    <Box component="svg" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden sx={{ ...sprite, inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <g stroke="#fff3df" strokeWidth={width * 0.9} strokeLinejoin="round" strokeLinecap="round" opacity={0.9}>
        <path d={curve} fill="none" strokeWidth={width * 1.9} />
        <polygon points={point} fill="#fff3df" />
      </g>
      <path d={curve} fill="none" stroke={MAROON} strokeWidth={width} strokeLinecap="round" />
      <polygon points={point} fill={MAROON} stroke={MAROON} strokeWidth={width * 0.3} strokeLinejoin="round" />
    </Box>
  );
};

// a window onto the real board, zoomed to the part a rule is about
const BoardWindow = ({ scene }) => {
  const { crop } = scene;
  const mode = scene.mode ?? "single";
  const view = VIEWS[mode];
  const isWhole = crop.width === BOARD;
  const shut = scene.shut ? shutHolesOf([YOU], [scene.marbles.filter(([, seat]) => seat === YOU).map(([place]) => place), []]) : [];
  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        maxWidth: "100%",
        aspectRatio: `${crop.width} / ${crop.height}`,
        overflow: "hidden",
        borderRadius: isWhole ? 0 : 3,
        border: isWhole ? "none" : "2px solid #e8c48a",
        boxShadow: isWhole ? "none" : "0 8px 18px rgba(0, 0, 0, 0.45)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: `${(BOARD / crop.width) * 100}%`,
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
          aspectRatio: "1",
        }}
      >
        <Box component="img" alt="" src={boardArtOf(mode).board} sx={{ ...sprite, inset: 0, width: "100%" }} />
        <Marks tones={TONES[mode]} view={view} shut={shut} />
        <Swirls view={view} isStill />
        {scene.ghost && <Marble place={scene.ghost} seat={YOU} mode={mode} isGhost />}
        {scene.marbles.map(([place, seat]) => (
          <Marble key={`${place.at}${place.index ?? place.slot}.${seat}`} place={place} seat={seat} mode={mode} />
        ))}
        {scene.arrow && <Arrow from={scene.arrow[0]} to={scene.arrow[1]} seat={scene.arrow[2] ?? YOU} via={scene.arrow[3]} crop={crop} view={view} />}
        {scene.knockout && <Cross {...pointOf(scene.knockout[0], scene.knockout[1], view)} />}
        <ShutHome holes={shut} view={view} />
      </Box>
    </Box>
  );
};

// cards laid out in a straight row, as the hand is
const Cards = ({ cards, width, picked }) => (
  <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "center", height: "100%", pb: 1 }}>
    {cards.map((shown) => (
      <Box
        key={shown.id}
        sx={{
          width,
          mx: "-3px",
          position: "relative",
          zIndex: shown === picked ? 1 : 0,
          transform: `translateY(${shown === picked ? -6 : 0}px)`,
          filter: "drop-shadow(0 4px 7px rgba(0, 0, 0, 0.45))",
          ...(shown === picked && {
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              borderRadius: "6.5% / 4.6%",
              boxShadow: "0 0 0 2px #9bd5ff, 0 0 0 3.5px rgba(61, 155, 255, 0.9), 0 0 12px 3px rgba(40, 130, 255, 0.7)",
            },
          }),
        }}
      >
        <CardFace card={shown} tones={CARD_TONES} />
      </Box>
    ))}
  </Stack>
);

// the rules drawn with the game's own board, marbles and cards, so a picture looks like the moment it explains; two against two names its pictures "team-"
const JackarooRulesArt = ({ picture }) => {
  if (picture === "turn") return <Cards cards={HAND} width={74} picked={HAND[1]} />;
  if (picture === "special") return <Cards cards={SPECIALS} width={64} />;
  if (picture === "team-turn" || picture === "team-special") {
    return (
      <ModeContext.Provider value="teams">
        {picture === "team-turn" ? <Cards cards={HAND} width={74} picked={HAND[1]} /> : <Cards cards={TEAM_SPECIALS} width={64} />}
      </ModeContext.Provider>
    );
  }
  const scene = picture.startsWith("team-") ? { ...TEAM_SCENES[picture.slice("team-".length)], mode: "teams" } : SCENES[picture];
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "center", height: "100%", maxWidth: "100%" }}>
      <BoardWindow scene={scene} />
      {scene.card && (
        <Box sx={{ width: 74, flexShrink: 0, transform: "rotate(5deg)", filter: "drop-shadow(0 4px 7px rgba(0, 0, 0, 0.45))" }}>
          <CardFace card={scene.card} tones={CARD_TONES} />
        </Box>
      )}
    </Stack>
  );
};

export default JackarooRulesArt;
