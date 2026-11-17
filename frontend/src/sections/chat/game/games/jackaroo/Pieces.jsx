import { memo, useId } from "react";
import { Box, ButtonBase } from "@mui/material";
import { keyframes, lighten } from "@mui/material/styles";

import art from "@/sections/chat/game/games/jackaroo/art";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";
import { BOARD, centredAt, marbleKey, pointOf, SPRITES, startOf } from "@/sections/chat/game/games/jackaroo/geometry";
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

const NO_HOLES = [];
const HOME_SLOTS = [0, 1, 2, 3];

// the empty holes of each home shut by another player's marble at its door
export const shutHolesOf = (seats, marbles) =>
  seats.flatMap((seat) =>
    HOME_SLOTS.filter((slot) => !marbles[seat].some((place) => place.at === "home" && place.slot === slot)).map((slot) => ({ seat, slot }))
  );

// each seat's home and start are ringed in its colour, the start because nobody may pass a marble sitting there; a shut hole greys
const Marks = memo(({ tones, view, shut = NO_HOLES }) =>
  view.positions.map((_, seat) => {
    const places = [...HOME_SLOTS.map((slot) => ({ at: "home", slot })), { at: "track", index: startOf(seat, view) }];
    const isShut = (place) => place.at === "home" && shut.some((hole) => hole.seat === seat && hole.slot === place.slot);
    return (
      <Box key={seat}>
        {places.map((place) => (
          <Box
            key={`${place.at}${place.slot ?? place.index}`}
            component="img"
            alt=""
            src={art.ring(tones[seat])}
            sx={{
              ...sprite,
              ...centredAt(pointOf(place, seat, view), SPRITES.mark),
              filter: isShut(place) ? "grayscale(1)" : "none",
              opacity: isShut(place) ? 0.45 : 1,
              transition: "filter 300ms ease, opacity 300ms ease",
            }}
          />
        ))}
      </Box>
    );
  })
);

const Swirls = memo(({ view, isStill }) =>
  Object.keys(view.layout.teleports ?? {}).map((index) => (
    <Box
      key={index}
      component="img"
      alt=""
      src={art.swirl}
      sx={{
        ...sprite,
        ...centredAt(pointOf({ at: "track", index: Number(index) }, 0, view), SPRITES.swirl),
        animation: isStill ? "none" : `${turn} 6s linear infinite`,
      }}
    />
  ))
);

const BALL_SHARE = SPRITES.marble / SPRITES.shadow;
// the cut marbles stand a little proud of the holes, so the board draws them smaller, about the size of a hole's ring
const MARBLE_SIZE = SPRITES.shadow * 0.86;

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
      ...centredAt({ x, y }, MARBLE_SIZE * 0.46),
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
  <Box ref={(element) => register(`${owner}.${id}`, element)} sx={{ ...sprite, ...centredAt({ x, y }, MARBLE_SIZE) }}>
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

// the winners' glows lie under every marble, so one never washes over the marble beside it; partners win together
export const Marbles = ({ marbles, tones, view, winners, glowsAfter, register }) => [
  ...winners.flatMap((winner) =>
    marbles[winner].map((place, id) => <Glow key={`glow.${winner}.${id}`} {...pointOf(place, winner, view)} delay={glowsAfter} />)
  ),
  ...marbles.flatMap((places, owner) =>
    places.map((place, id) => {
      const { x, y } = pointOf(place, owner, view);
      const isShielded = place.at === "track" && place.index === startOf(owner, view);
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

// the marble art leaves a clear margin round its ball, which fills this share of it
const BALL_FILL = 0.85;
const BALL_ACROSS = MARBLE_SIZE * BALL_SHARE * BALL_FILL;
const HALO = MARBLE_SIZE * BALL_SHARE * 1.8;
const HALO_SPILL = ((HALO / TARGET - 1) / 2) * 100;
const HALO_CLEAR = (BALL_ACROSS / HALO) * 100;
// only its brightness breathes, since growing would pull its clear middle off the ball
const glowAround = keyframes`0%, 100% { opacity: 0.55; } 50% { opacity: 1; }`;

// a pale halo round each marble that can be chosen, clear over the ball itself; tapping one hands its own marble back
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
        inset: `-${HALO_SPILL}%`,
        borderRadius: "50%",
        background: `radial-gradient(circle closest-side, transparent ${HALO_CLEAR}%, rgba(255, 252, 240, 0.85) ${HALO_CLEAR + 1}%, rgba(255, 252, 240, 0.6) 76%, rgba(255, 252, 240, 0.2) 92%, transparent 100%)`,
        animation: `${glowAround} 1.2s ease-in-out infinite`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      },
    }}
  />
));

export const Targets = ({ targets, onPick }) =>
  targets.map(({ value, x, y, label }) => <Target key={value} value={value} x={x} y={y} label={label} onPick={onPick} />);

const BUBBLE = 28;
const BUBBLE_GAP = 4;
const popIn = keyframes`from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); }`;

// a numbered bubble just off its marble, turned to point back at it, with the number kept upright
const CrowdChoice = ({ x, y, angle, number, value, label, onPick }) => (
  <Box sx={{ ...centredAt({ x, y }, TARGET), zIndex: 3, transform: `rotate(${angle}deg)`, pointerEvents: "none" }}>
    <ButtonBase
      aria-label={`${number}: ${label}`}
      data-value={value}
      onClick={onPick}
      sx={{
        position: "absolute",
        left: `calc(100% + ${BUBBLE_GAP}px)`,
        top: "50%",
        width: BUBBLE,
        height: BUBBLE,
        mt: `-${BUBBLE / 2}px`,
        pointerEvents: "auto",
        borderRadius: "50%",
        bgcolor: "rgba(20, 12, 8, 0.92)",
        border: "2px solid #f0b860",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
        animation: `${popIn} 180ms ease-out both`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        "&::before": {
          content: '""',
          position: "absolute",
          left: -6,
          top: "50%",
          width: 9,
          height: 9,
          mt: "-4.5px",
          bgcolor: "rgba(20, 12, 8, 0.92)",
          borderLeft: "2px solid #f0b860",
          borderBottom: "2px solid #f0b860",
          transform: "rotate(45deg)",
        },
      }}
    >
      <Box
        component="span"
        sx={{ transform: `rotate(${-angle}deg)`, fontFamily: FONTS.display, fontWeight: 700, fontSize: 16, lineHeight: 1, color: "#ffd34d" }}
      >
        {number}
      </Box>
    </ButtonBase>
  </Box>
);

const TURNS = [0, 45, -45, 90, -90, 135, -135, 180];

// each bubble points away from the crowd's middle, turned only as far as it takes to stay on screen and clear of the other marbles and bubbles
const anglesOf = (ordered, centre, { left, right, scale }) => {
  const half = (BUBBLE / 2 + BUBBLE_GAP) / scale;
  const reach = TARGET / 2 + half;
  const placed = [];
  return ordered.map((target) => {
    const away = (Math.atan2(target.y - centre.y, target.x - centre.x) * 180) / Math.PI;
    const bubbleAt = (angle) => ({ x: target.x + Math.cos((angle * Math.PI) / 180) * reach, y: target.y + Math.sin((angle * Math.PI) / 180) * reach });
    const isOnScreen = (angle) => bubbleAt(angle).x - half >= left && bubbleAt(angle).x + half <= right;
    const isClear = (angle) => {
      const at = bubbleAt(angle);
      const near = (point, gap) => Math.hypot(point.x - at.x, point.y - at.y) < gap;
      return !placed.some((other) => near(other, half * 2)) && !ordered.some((other) => other !== target && near(other, half + SPRITES.marble / 2));
    };
    const angles = TURNS.map((turn) => away + turn).filter(isOnScreen);
    const angle = angles.find(isClear) ?? angles[0] ?? away;
    placed.push(bubbleAt(angle));
    return angle;
  });
};

// marbles too close to tap apart are numbered in reading order
export const Crowd = ({ targets, span, onPick }) => {
  const centre = {
    x: targets.reduce((sum, target) => sum + target.x, 0) / targets.length,
    y: targets.reduce((sum, target) => sum + target.y, 0) / targets.length,
  };
  const xs = targets.map((target) => target.x);
  const ys = targets.map((target) => target.y);
  const isAcross = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys);
  const ordered = [...targets].sort((one, two) => (isAcross ? one.x - two.x : one.y - two.y));
  const angles = anglesOf(ordered, centre, span);
  return ordered.map((target, index) => <CrowdChoice key={target.value} {...target} number={index + 1} angle={angles[index]} onPick={onPick} />);
};

// the red cross marking a marble a move would knock out
export const Cross = ({ x, y }) => (
  <Box component="svg" viewBox="0 0 20 20" aria-hidden sx={{ ...sprite, ...centredAt({ x, y }, SPRITES.marble * 0.55), overflow: "visible" }}>
    <path d="M4 4L16 16M16 4L4 16" stroke="#fff" strokeWidth={5.5} strokeLinecap="round" />
    <path d="M4 4L16 16M16 4L4 16" stroke="#e01b2f" strokeWidth={3.2} strokeLinecap="round" />
  </Box>
);

// a home shut by another player's marble at its door: every empty hole in it is crossed out until that marble goes
export const ShutHome = memo(({ holes, view }) =>
  holes.map(({ seat, slot }) => (
    <Box
      key={`${seat}-${slot}`}
      component="svg"
      viewBox="0 0 20 20"
      aria-hidden
      sx={{ ...sprite, ...centredAt(pointOf({ at: "home", slot }, seat, view), SPRITES.marble * 0.6), overflow: "visible" }}
    >
      <path d="M5 5L15 15M15 5L5 15" stroke="rgba(255, 240, 215, 0.55)" strokeWidth={5} strokeLinecap="round" />
      <path d="M5 5L15 15M15 5L5 15" stroke="#4a2a14" strokeWidth={2.8} strokeLinecap="round" />
    </Box>
  ))
);

const isTaken = (marbles, owner, place) =>
  place.at === "track"
    ? marbles.some((places) => places.some((other) => other.at === "track" && other.index === place.index))
    : marbles[owner].some((other) => other.at === "home" && other.slot === place.slot);

const RING_GAP = 0.8;
const RING_WIDTH = 2.6;
// a step's dot leaves the hole's dark rim showing round it
const DOT_SHARE = 0.7;

// where a move would go: a lit dot in each empty hole it steps through, a ring outside the lip where it stops, and a cross on each marble it knocks out
export const Preview = ({ moves, marbles, tones, view }) => {
  const { holeRadius, lipRadius } = view.layout;
  // the ids name gradients, where the colons React puts in an id are not safe
  const prefix = useId().replaceAll(":", "");
  return (
    <>
      <Box component="svg" viewBox={`0 0 ${BOARD} ${BOARD}`} aria-hidden sx={{ ...sprite, inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        {moves.map((move, index) => {
          const { owner } = move.marble;
          const colour = PALETTE[tones[owner]];
          const end = pointOf(move.path.at(-1), owner, view);
          const lit = `${prefix}lit${index}`;
          return (
            <g key={index} fill={`url(#${lit})`}>
              <radialGradient id={lit} cx="0.4" cy="0.38" r="0.65">
                <stop offset="0" stopColor={lighten(colour, 0.45)} />
                <stop offset="0.7" stopColor={colour} />
              </radialGradient>
              {move.path
                .filter((place) => !isTaken(marbles, owner, place))
                .map((place) => {
                  const { x, y } = pointOf(place, owner, view);
                  return <circle key={`${x},${y}`} cx={x} cy={y} r={holeRadius * DOT_SHARE} />;
                })}
              <circle cx={end.x} cy={end.y} r={lipRadius + RING_GAP + RING_WIDTH / 2} fill="none" stroke={colour} strokeWidth={RING_WIDTH} />
            </g>
          );
        })}
      </Box>
      {moves.flatMap((move) =>
        move.captured.map((marble) => {
          const { x, y } = pointOf(marbles[marble.owner][marble.id], marble.owner, view);
          return <Cross key={`${marble.owner}.${marble.id}`} x={x + SPRITES.marble * 0.45} y={y - SPRITES.marble * 0.45} />;
        })
      )}
    </>
  );
};

export { Marks, Swirls };
