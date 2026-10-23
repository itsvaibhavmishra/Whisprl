import { memo } from "react";
import { Box, Typography } from "@mui/material";

import art from "@/sections/chat/game/games/jackaroo/art";
import { faceOf, isRed, rankOf } from "@/sections/chat/game/games/jackaroo/cards";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";
import Suit from "@/sections/chat/game/games/jackaroo/Suit";

const RED = "#b0141c";
const BLACK = "#1d1d24";
// the design's cards are a little taller than the blank face, so the face is stretched to their shape
export const CARD_RATIO = 0.71;
// faces are drawn in shares of the card's width, so its height in those units follows from its shape
const HEIGHT = 100 / CARD_RATIO;

const Numeral = ({ text, x = 50, y = 72, size = 52 }) => (
  <text x={x} y={y} fontSize={size} textAnchor="middle" dominantBaseline="central">
    {text}
  </text>
);

const Pointer = ({ x, y, size, isDown = false }) => {
  const half = size / 2;
  const points = isDown
    ? [x - half, y - half * 0.7, x + half, y - half * 0.7, x, y + half * 0.7]
    : [x - half * 0.7, y - half, x - half * 0.7, y + half, x + half * 0.7, y];
  return <polygon points={points.join(" ")} />;
};

const Rule = ({ y }) => <rect x={15} y={y - 1.3} width={70} height={2.6} rx={1.3} />;

const KnockOut = ({ x, y, radius }) => {
  const arm = radius / 2;
  return (
    <g fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <circle cx={x} cy={y} r={radius} />
      <path d={`M${x - arm} ${y - arm}L${x + arm} ${y + arm}M${x + arm} ${y - arm}L${x - arm} ${y + arm}`} />
    </g>
  );
};

const Person = ({ x, y }) => (
  <>
    <circle cx={x} cy={y - 9} r={6.5} />
    <path d={`M${x - 11} ${y + 11}C${x - 11} ${y - 2} ${x + 11} ${y - 2} ${x + 11} ${y + 11}Z`} />
  </>
);

// a card with a tear down it, which is a card thrown away
const TornCard = ({ x, y, tilt, scale = 1 }) => (
  <g transform={`rotate(${tilt} ${x} ${y}) translate(${x} ${y}) scale(${scale})`}>
    <rect x={-9} y={-12.5} width={18} height={25} rx={3} />
    <polyline points="2,-12.5 -1.5,-5 3,0.5 -0.5,7 1.5,12.5" fill="none" stroke="#fff6ea" strokeWidth={1.8} strokeLinejoin="round" />
  </g>
);

const CurvedArrow = ({ from, via, to }) => {
  const angle = Math.atan2(to[1] - via[1], to[0] - via[0]);
  const head = 7;
  const tip = [to[0] + Math.cos(angle) * head * 0.6, to[1] + Math.sin(angle) * head * 0.6];
  const barb = (side) => [tip[0] - Math.cos(angle + side * 0.6) * head, tip[1] - Math.sin(angle + side * 0.6) * head];
  return (
    <>
      <path d={`M${from.join(" ")}Q${via.join(" ")} ${to.join(" ")}`} fill="none" stroke="currentColor" strokeWidth={4.2} strokeLinecap="round" />
      <polygon points={[tip, barb(1), barb(-1)].flat().join(" ")} />
    </>
  );
};

// each face as the marbles on it, placed in card units and "mine" or "theirs" by who holds it, and a drawing in the suit's colour
const FACES = {
  number: { drawing: (card) => <Numeral text={card.rank} size={card.rank > 9 ? 44 : 52} /> },
  back: { drawing: () => <Numeral text="−4" size={46} /> },
  anyone: {
    marbles: [
      { who: "mine", x: 29, y: 99, size: 11 },
      { who: "theirs", x: 43, y: 99, size: 11 },
      { who: "mine", x: 57, y: 99, size: 11 },
      { who: "theirs", x: 71, y: 99, size: 11 },
    ],
    drawing: () => <Numeral text="5" y={62} />,
  },
  split: {
    marbles: [
      { who: "mine", x: 34, y: 99, size: 12 },
      { who: "mine", x: 56, y: 99, size: 12 },
    ],
    drawing: () => (
      <>
        <Numeral text="7" y={62} />
        <Numeral text="+" x={45} y={99} size={16} />
        <Numeral text="=" x={67} y={99} size={16} />
      </>
    ),
  },
  out: {
    marbles: [{ who: "mine", x: 50, y: 62, size: 22 }],
    drawing: (card) => (
      <>
        <Pointer x={50} y={42} size={21} isDown />
        <Rule y={81} />
        <Numeral text={card.rank} y={99} size={24} />
      </>
    ),
  },
  sweep: {
    marbles: [{ who: "mine", x: 50, y: 62, size: 22 }],
    drawing: () => (
      <>
        <Pointer x={50} y={42} size={21} isDown />
        <Rule y={81} />
        <Numeral text="13" x={37} y={99} size={22} />
        <Pointer x={53} y={99} size={11} />
        <KnockOut x={67} y={99} radius={6.5} />
      </>
    ),
  },
  discard: {
    drawing: () => (
      <>
        <Person x={38} y={62} />
        <TornCard x={62} y={62} tilt={8} />
        <Rule y={81} />
        <Numeral text="10" y={99} size={22} />
      </>
    ),
  },
  take: {
    drawing: () => (
      <>
        <Pointer x={35} y={72} size={22} />
        <TornCard x={61} y={72} tilt={-8} scale={1.25} />
      </>
    ),
  },
  swap: {
    marbles: [
      { who: "mine", x: 64, y: 54, size: 22 },
      { who: "theirs", x: 36, y: 90, size: 22 },
    ],
    drawing: () => (
      <>
        <CurvedArrow from={[53, 46]} via={[34, 44]} to={[34, 68]} />
        <CurvedArrow from={[47, 98]} via={[66, 100]} to={[66, 76]} />
      </>
    ),
  },
};

const Marble = ({ tone, x, y, size }) => (
  <Box
    component="img"
    alt=""
    src={art.marble(tone)}
    sx={{
      position: "absolute",
      left: `${x}%`,
      top: `${(y / HEIGHT) * 100}%`,
      width: `${size}cqw`,
      transform: "translate(-50%, -50%)",
      display: "block",
      filter: "drop-shadow(0.4cqw 1.6cqw 1.1cqw rgba(60, 25, 5, 0.45))",
    }}
  />
);

const Corner = ({ card, colour }) => (
  <Box sx={{ position: "absolute", left: "9%", top: "6%", textAlign: "center" }}>
    <Typography sx={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "23cqw", lineHeight: 1, letterSpacing: "-0.04em", color: colour }}>
      {rankOf(card)}
    </Typography>
    <Suit suit={card.suit} colour={colour} sx={{ width: "14cqw", mx: "auto", mt: "1cqw" }} />
  </Box>
);

// the design's card: its paper, its rank and suit in the corner, and in the middle what it does, in symbols rather than words
const CardFace = ({ card, tones }) => {
  const colour = isRed(card) ? RED : BLACK;
  const face = FACES[faceOf(card)];
  return (
    <Box sx={{ position: "relative", width: "100%", aspectRatio: String(CARD_RATIO), containerType: "inline-size", userSelect: "none" }}>
      <Box component="img" alt="" src={art.card} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      <Corner card={card} colour={colour} />
      <Box
        component="svg"
        viewBox={`0 0 100 ${HEIGHT}`}
        aria-hidden
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", color: colour, fill: "currentColor", fontFamily: FONTS.display, fontWeight: 700 }}
      >
        {face.drawing(card)}
      </Box>
      {face.marbles?.map((marble, index) => (
        <Marble key={index} tone={tones[marble.who]} x={marble.x} y={marble.y} size={marble.size} />
      ))}
    </Box>
  );
};

// a card never changes once dealt, so its face redraws only when it is a different card or its marbles change colour
export default memo(
  CardFace,
  (before, after) => before.card.id === after.card.id && before.tones.mine === after.tones.mine && before.tones.theirs === after.tones.theirs
);
