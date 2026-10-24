import { Box, Stack } from "@mui/material";

import art from "@/sections/chat/game/games/jackaroo/art";
import CardFace from "@/sections/chat/game/games/jackaroo/CardFace";
import { centredAt, pointOf, SPRITES } from "@/sections/chat/game/games/jackaroo/geometry";
import layout from "@/sections/chat/game/games/jackaroo/layout.json";
import { Cross, Marks, Swirls } from "@/sections/chat/game/games/jackaroo/Pieces";

// you play blue from the bottom against red, as the design's screens show it
const YOU = 4;
const THEM = 0;
const TONES = [YOU, THEM];
const CARD_TONES = { mine: YOU, theirs: THEM };
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
      [track(5), YOU],
      [track(9), THEM],
    ],
    arrow: [track(5), track(9)],
    knockout: track(9),
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
    arrow: [track(45), home(1)],
  },
};

const HAND = [card(1, "C"), card(6, "S"), card(7, "H"), card(12, "D")];
const SPECIALS = [card(4, "S"), card(7, "H"), card(10, "C"), card(11, "S"), card(13, "S")];

const sprite = { position: "absolute", display: "block", pointerEvents: "none" };
const at = (place, owner) => pointOf(place, owner, false);

const Marble = ({ place, tone, isGhost = false }) => (
  <Box
    component="img"
    alt=""
    src={art.marble(tone)}
    sx={{
      ...sprite,
      ...centredAt(at(place, tone === YOU ? 0 : 1), SPRITES.marble),
      opacity: isGhost ? 0.55 : 1,
      filter: "drop-shadow(0 2px 2px rgba(40, 18, 4, 0.5))",
    }}
  />
);

// a bold maroon curve edged in cream so it reads over wood and holes, bent toward the open middle and away from the holes
const Arrow = ({ from, to, crop }) => {
  const start = at(...from);
  const end = at(...to);
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const inward = { x: layout.board / 2 - middle.x, y: layout.board / 2 - middle.y };
  const inwardLength = Math.hypot(inward.x, inward.y) || 1;
  const bend = { x: middle.x + (inward.x / inwardLength) * length * 0.3, y: middle.y + (inward.y / inwardLength) * length * 0.3 };
  const width = crop.width * 0.024;
  const head = crop.width * 0.075;
  // the curve leaves and reaches each marble at its edge, so neither is hidden under it
  const reach = SPRITES.marble * 0.6;
  const leave = Math.atan2(bend.y - start.y, bend.x - start.x);
  const arrive = Math.atan2(end.y - bend.y, end.x - bend.x);
  const from_ = { x: start.x + Math.cos(leave) * reach, y: start.y + Math.sin(leave) * reach };
  const tip = { x: end.x - Math.cos(arrive) * reach, y: end.y - Math.sin(arrive) * reach };
  const neck = { x: tip.x - Math.cos(arrive) * head * 0.7, y: tip.y - Math.sin(arrive) * head * 0.7 };
  const barb = (side) => `${tip.x - Math.cos(arrive + side * 0.55) * head},${tip.y - Math.sin(arrive + side * 0.55) * head}`;
  const curve = `M${from_.x} ${from_.y} Q${bend.x} ${bend.y} ${neck.x} ${neck.y}`;
  const point = `${tip.x},${tip.y} ${barb(1)} ${barb(-1)}`;
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${layout.board} ${layout.board}`}
      aria-hidden
      sx={{ ...sprite, inset: 0, width: "100%", height: "100%", overflow: "visible" }}
    >
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
  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        maxWidth: "100%",
        aspectRatio: `${crop.width} / ${crop.height}`,
        overflow: "hidden",
        borderRadius: crop.width === layout.board ? 0 : 3,
        border: crop.width === layout.board ? "none" : "2px solid #e8c48a",
        boxShadow: crop.width === layout.board ? "none" : "0 8px 18px rgba(0, 0, 0, 0.45)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: `${(layout.board / crop.width) * 100}%`,
          left: `${(-crop.x / crop.width) * 100}%`,
          top: `${(-crop.y / crop.height) * 100}%`,
          aspectRatio: "1",
        }}
      >
        <Box component="img" alt="" src={art.board} sx={{ ...sprite, inset: 0, width: "100%" }} />
        <Marks tones={TONES} isTurned={false} />
        <Swirls isTurned={false} isStill />
        {scene.ghost && <Marble place={scene.ghost} tone={YOU} isGhost />}
        {scene.marbles.map(([place, tone]) => (
          <Marble key={`${place.at}${place.index ?? place.slot}${tone}`} place={place} tone={tone} />
        ))}
        {scene.arrow && <Arrow from={[scene.arrow[0], 0]} to={[scene.arrow[1], 0]} crop={crop} />}
        {scene.knockout && <Cross {...at(scene.knockout, 1)} />}
      </Box>
    </Box>
  );
};

// cards laid out in a gentle fan, as the hand is
const Cards = ({ cards, width, picked }) => (
  <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "center", height: "100%", pb: 1 }}>
    {cards.map((shown, index) => {
      const spread = index - (cards.length - 1) / 2;
      return (
        <Box
          key={shown.id}
          sx={{
            width,
            mx: "-3px",
            position: "relative",
            zIndex: shown === picked ? 1 : 0,
            transform: `translateY(${spread ** 2 * 2 - (shown === picked ? 6 : 0)}px) rotate(${spread * 4.6}deg)`,
            transformOrigin: "50% 100%",
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
      );
    })}
  </Stack>
);

// the rules drawn with the game's own board, marbles and cards, so a picture looks like the moment it explains
const JackarooRulesArt = ({ picture }) => {
  if (picture === "turn") return <Cards cards={HAND} width={74} picked={HAND[1]} />;
  if (picture === "special") return <Cards cards={SPECIALS} width={64} />;
  const scene = SCENES[picture];
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
