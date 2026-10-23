import { memo, useId } from "react";
import { Box, ButtonBase } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import art from "@/sections/chat/game/games/jackaroo/art";
import { centredAt, marbleKey, pointOf, SPRITES } from "@/sections/chat/game/games/jackaroo/geometry";
import layout from "@/sections/chat/game/games/jackaroo/layout.json";
import PALETTE from "@/sections/chat/game/games/jackaroo/palette";
import { HOME_SIZE } from "@/sections/chat/game/games/jackaroo/playback";

// the swirls turn slowly the whole game, on transform alone
const turn = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const beckon = keyframes`0%, 100% { transform: scale(0.85); opacity: 0.55; } 50% { transform: scale(1.08); opacity: 1; }`;
const appear = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const TARGET = 58;
// anything that pulses holds still for someone who has asked for less motion
const pulse = (seconds) => ({ animation: `${beckon} ${seconds}s ease-in-out infinite`, "@media (prefers-reduced-motion: reduce)": { animation: "none" } });

const sprite = { position: "absolute", display: "block", pointerEvents: "none", userSelect: "none" };

// each seat's home and start are ringed in its colour, the start because nobody may pass a marble sitting there
const Marks = memo(({ tones, isTurned }) =>
  [0, 1].map((seat) => {
    const places = [...layout.homes[seat].map((_, slot) => ({ at: "home", slot })), { at: "track", index: layout.start[seat] }];
    return (
      <Box key={seat}>
        {places.map((place) => (
          <Box
            key={`${place.at}${place.slot ?? place.index}`}
            component="img"
            alt=""
            src={art.ring(tones[seat])}
            sx={{ ...sprite, ...centredAt(pointOf(place, seat, isTurned), SPRITES.mark) }}
          />
        ))}
      </Box>
    );
  })
);

const Swirls = memo(({ isTurned, isStill }) =>
  Object.keys(layout.teleports).map((index) => (
    <Box
      key={index}
      component="img"
      alt=""
      src={art.swirl}
      sx={{
        ...sprite,
        ...centredAt(pointOf({ at: "track", index: Number(index) }, 0, isTurned), SPRITES.swirl),
        animation: isStill ? "none" : `${turn} 6s linear infinite`,
      }}
    />
  ))
);

const BALL_SHARE = SPRITES.marble / SPRITES.shadow;

// a marble on its own start sits in a glassy shield with light turning inside it, a moment after it lands there
const Shield = () => (
  <Box
    sx={{
      ...sprite,
      left: `${(1 - BALL_SHARE * 1.2) * 50}%`,
      top: `${(1 - BALL_SHARE * 1.2) * 50}%`,
      width: `${BALL_SHARE * 120}%`,
      height: `${BALL_SHARE * 120}%`,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(255, 255, 255, 0) 55%, rgba(234, 250, 176, 0.9) 72%, rgba(255, 255, 228, 0.35) 88%, rgba(255, 255, 255, 0) 100%)",
      animation: `${appear} 500ms ease 900ms both`,
      "&::after": {
        content: '""',
        position: "absolute",
        inset: "12%",
        borderRadius: "50%",
        background:
          "conic-gradient(rgba(255, 255, 224, 0) 0deg, rgba(255, 255, 224, 0.6) 70deg, rgba(255, 255, 224, 0) 150deg, rgba(214, 255, 170, 0.45) 230deg, rgba(255, 255, 224, 0) 310deg)",
        animation: `${turn} 2.4s linear infinite`,
      },
      "@media (prefers-reduced-motion: reduce)": { animation: "none", "&::after": { animation: "none" } },
    }}
  />
);

// a winning marble's glow, faded in once its last move has played out
const Glow = ({ x, y, delay }) => (
  <Box
    sx={{
      ...sprite,
      ...centredAt({ x, y }, SPRITES.shadow * 0.46),
      animation: `${appear} 400ms ease ${delay}ms both`,
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}
  >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        boxShadow: "0 0 0 2.5px rgba(255, 249, 230, 0.95), 0 0 16px 7px rgba(255, 190, 70, 0.95)",
        ...pulse(1.4),
      }}
    />
  </Box>
);

// a marble and its shadow: the shadow stays on the wood while the ball lifts off it on each hop
const Marble = memo(({ owner, id, x, y, tone, isHome, isShielded, register }) => (
  <Box ref={(element) => register(`${owner}.${id}`, element)} sx={{ ...sprite, ...centredAt({ x, y }, SPRITES.shadow) }}>
    <Box data-size sx={{ ...sprite, inset: 0, transform: isHome ? `scale(${HOME_SIZE})` : "none" }}>
      <Box component="img" alt="" data-shadow src={art.shadow} sx={{ ...sprite, inset: 0, width: "100%", height: "100%" }} />
      <Box
        component="img"
        alt=""
        data-ball
        src={art.marble(tone)}
        sx={{ ...sprite, left: `${(1 - BALL_SHARE) * 50}%`, top: `${(1 - BALL_SHARE) * 50}%`, width: `${BALL_SHARE * 100}%` }}
      />
      {isShielded && <Shield />}
    </Box>
  </Box>
));

// the winner's glows lie under every marble, so one never washes over the marble beside it
export const Marbles = ({ marbles, tones, isTurned, winner, glowsAfter, register }) => [
  ...(winner === null ? [] : marbles[winner].map((place, id) => <Glow key={`glow.${id}`} {...pointOf(place, winner, isTurned)} delay={glowsAfter} />)),
  ...marbles.flatMap((places, owner) =>
    places.map((place, id) => {
      const { x, y } = pointOf(place, owner, isTurned);
      const isShielded = place.at === "track" && place.index === layout.start[owner];
      return (
        <Marble
          key={marbleKey({ owner, id })}
          owner={owner}
          id={id}
          x={x}
          y={y}
          tone={tones[owner]}
          isHome={place.at === "home"}
          isShielded={isShielded}
          register={register}
        />
      );
    })
  ),
];

// a white halo pulsing round each marble that can be chosen; tapping one hands its own marble back
const Target = memo(({ x, y, label, value, onPick }) => (
  <ButtonBase
    aria-label={label}
    data-value={value}
    onClick={onPick}
    sx={{
      ...centredAt({ x, y }, TARGET),
      position: "absolute",
      borderRadius: "50%",
      "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        border: "3px solid #fff8ea",
        boxShadow: "0 0 10px 2px rgba(255, 248, 234, 0.8)",
        ...pulse(1.1),
      },
    }}
  />
));

export const Targets = ({ targets, isTurned, onPick }) =>
  targets.map(({ value, place, owner, label }) => {
    const { x, y } = pointOf(place, owner, isTurned);
    return <Target key={value} value={value} x={x} y={y} label={label} onPick={onPick} />;
  });

// the red cross marking a marble a move would knock out
export const Cross = ({ x, y }) => (
  <Box component="svg" viewBox="0 0 20 20" aria-hidden sx={{ ...sprite, ...centredAt({ x, y }, SPRITES.marble * 0.55), overflow: "visible" }}>
    <path d="M4 4L16 16M16 4L4 16" stroke="#fff" strokeWidth={5.5} strokeLinecap="round" />
    <path d="M4 4L16 16M16 4L4 16" stroke="#e01b2f" strokeWidth={3.2} strokeLinecap="round" />
  </Box>
);

const shimmer = keyframes`0%, 100% { transform: scale(0.92); opacity: 0.85; } 50% { transform: scale(1.12); opacity: 1; }`;
const sheen = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const STILL = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } };

// where a move stops: a glow of the marble's colour with light turning across it
const Stop = ({ x, y, colour }) => (
  <Box sx={{ ...sprite, ...centredAt({ x, y }, SPRITES.mark * 1.5), animation: `${shimmer} 1.3s ease-in-out infinite`, ...STILL }}>
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        background: `radial-gradient(circle, #fffdf4 0%, ${colour} 26%, ${colour} 46%, transparent 70%)`,
        filter: "drop-shadow(0 0 3px rgba(50, 25, 5, 0.55))",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        inset: "14%",
        borderRadius: "50%",
        background:
          "conic-gradient(rgba(255, 255, 255, 0) 0deg, rgba(255, 255, 255, 0.75) 40deg, rgba(255, 255, 255, 0) 90deg, rgba(255, 255, 255, 0) 180deg, rgba(255, 255, 255, 0.5) 220deg, rgba(255, 255, 255, 0) 270deg)",
        mixBlendMode: "soft-light",
        animation: `${sheen} 1.8s linear infinite`,
        ...STILL,
      }}
    />
  </Box>
);

// where a move would go: one soft trail of the marble's colour from where it stands, growing stronger to a shimmering stop, and a cross on each marble it knocks out
export const Preview = ({ moves, marbles, tones, isTurned }) => {
  // the ids name gradients and a filter, where the colons React puts in an id are not safe
  const prefix = useId().replaceAll(":", "");
  return (
    <>
      <Box
        component="svg"
        viewBox={`0 0 ${layout.board} ${layout.board}`}
        aria-hidden
        sx={{ ...sprite, inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <filter id={`${prefix}soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={layout.holeRadius * 0.35} />
          </filter>
        </defs>
        {moves.map((move, index) => {
          const { owner, id } = move.marble;
          const points = [marbles[owner][id], ...move.path].map((place) => pointOf(place, owner, isTurned));
          const [first, last] = [points[0], points.at(-1)];
          const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
          const fade = `${prefix}fade${index}`;
          return (
            <g key={index}>
              <linearGradient id={fade} gradientUnits="userSpaceOnUse" x1={first.x} y1={first.y} x2={last.x} y2={last.y}>
                <stop offset="0" stopColor={PALETTE[tones[owner]]} stopOpacity="0.3" />
                <stop offset="0.5" stopColor={PALETTE[tones[owner]]} stopOpacity="0.32" />
                <stop offset="1" stopColor={PALETTE[tones[owner]]} stopOpacity="0.6" />
              </linearGradient>
              {/* a soft shade under the trail, so a light colour shows on the light wood as clearly as a dark one */}
              <polyline
                points={line}
                fill="none"
                stroke="rgba(50, 25, 5, 0.18)"
                strokeWidth={layout.holeRadius * 2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${prefix}soft)`}
              />
              <polyline
                points={line}
                fill="none"
                stroke={`url(#${fade})`}
                strokeWidth={layout.holeRadius * 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${prefix}soft)`}
              />
              <polyline points={line} fill="none" stroke={`url(#${fade})`} strokeWidth={layout.holeRadius * 0.7} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      </Box>
      {moves.map((move, index) => (
        <Stop key={index} {...pointOf(move.path.at(-1), move.marble.owner, isTurned)} colour={PALETTE[tones[move.marble.owner]]} />
      ))}
      {moves.flatMap((move) =>
        move.captured.map((marble) => <Cross key={`${marble.owner}.${marble.id}`} {...pointOf(marbles[marble.owner][marble.id], marble.owner, isTurned)} />)
      )}
    </>
  );
};

export { Marks, Swirls };
