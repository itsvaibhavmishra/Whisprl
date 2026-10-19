import { useId, useState } from "react";
import { Box, ButtonBase } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { m, useReducedMotion } from "framer-motion";

import { neighboursOf, totalOf } from "@/sections/chat/game/games/chain-reaction/cascade";
import Orb, { OrbDefs } from "@/sections/chat/game/games/chain-reaction/Orb";
import { colourOf, toneOf } from "@/sections/chat/game/games/chain-reaction/palette";
import useCascade from "@/sections/chat/game/games/chain-reaction/useCascade";

// the board's own units: a cell is a hundred across, so everything inside one is a share of that
const CELL = 100;
const GAP = 4;
const ORB = 17;
const SPREAD = 19;
const MAX_WIDTH = 560;
const CELL_ROUND = 14;
// the board's corners are rounded in its own units, so a corner cell can follow the same curve
const BOARD_ROUND = 32;

// a cell one orb from bursting shivers, which is how this game shows where the danger is
const tremble = keyframes`
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(1.6px, -1px); }
  50% { transform: translate(-1.2px, 1.4px); }
  75% { transform: translate(1px, 1.2px); }
`;

// one orb in the middle, two side by side, and more around a ring
const spotsFor = (count) => {
  if (count <= 1) return [[0, 0]];
  const start = count === 2 ? 0 : -Math.PI / 2;
  return Array.from({ length: count }, (_, index) => {
    const angle = start + (index * 2 * Math.PI) / count;
    return [Math.cos(angle) * SPREAD, Math.sin(angle) * SPREAD];
  });
};

// a cell in a corner of the board takes that corner's curve, so its outline never pokes past the frame
const cornersOf = ({ width, height }, cell) => {
  const last = width * height - 1;
  return [0, width - 1, last, last - width + 1].map((corner) => (cell === corner ? BOARD_ROUND - GAP : CELL_ROUND));
};

const cellOutline = (half, [topLeft, topRight, bottomRight, bottomLeft]) =>
  [
    `M${topLeft - half} ${-half}`,
    `H${half - topRight}`,
    `A${topRight} ${topRight} 0 0 1 ${half} ${topRight - half}`,
    `V${half - bottomRight}`,
    `A${bottomRight} ${bottomRight} 0 0 1 ${half - bottomRight} ${half}`,
    `H${bottomLeft - half}`,
    `A${bottomLeft} ${bottomLeft} 0 0 1 ${-half} ${half - bottomLeft}`,
    `V${topLeft - half}`,
    `A${topLeft} ${topLeft} 0 0 1 ${topLeft - half} ${-half}`,
    "Z",
  ].join(" ");

const centreOf = ({ width }, cell) => ({ x: (cell % width) * CELL + CELL / 2, y: Math.floor(cell / width) * CELL + CELL / 2 });

const Flight = ({ grid, flight, prefix, tone }) =>
  flight.burst.flatMap((cell) => {
    const from = centreOf(grid, cell);
    return neighboursOf(grid, cell).map((neighbour) => {
      const to = centreOf(grid, neighbour);
      return (
        <m.g
          key={`${flight.round}-${cell}-${neighbour}`}
          initial={{ x: from.x, y: from.y }}
          animate={{ x: to.x, y: to.y }}
          transition={{ duration: (flight.ms * 0.9) / 1000, ease: "easeOut" }}
        >
          <Orb prefix={prefix} tone={tone} radius={ORB} />
        </m.g>
      );
    });
  });

const ChainReactionBoard = ({ state, onMove }) => {
  const prefix = `cr${useId().replace(/:/g, "")}`;
  const isStill = useReducedMotion();
  const cascade = useCascade(state, isStill);
  const [sent, setSent] = useState(null);
  if (!state) return null;
  // a new game on another size arrives a render before the cascade catches up, and its old board would not fit
  const board = cascade.board?.orbs.length === state.orbs.length ? cascade.board : state;
  const { flight } = cascade;

  const { width, height } = state;
  const turnColour = colourOf(state, state.turn);
  // a tap is outlined at once and the board waits for the count to move on, since a second tap would only come back as "not your turn"
  const sending = sent?.moves === totalOf(state) ? sent : null;
  const legal = new Set(sending ? [] : state.legalMoves ?? []);

  const place = async (cell) => {
    setSent({ cell, moves: totalOf(state) });
    const result = await onMove(cell);
    if (result?.meta?.requestStatus === "rejected") setSent(null);
  };

  return (
    // measured against both sides of the space it is given, so a short panel shrinks the board instead of clipping it
    <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: { xs: 1.5, sm: 2 }, containerType: "size" }}>
      <Box
        sx={{
          position: "relative",
          aspectRatio: `${width} / ${height}`,
          width: `min(${MAX_WIDTH}px, 100cqw, 100cqh * ${width} / ${height})`,
          borderRadius: `${(BOARD_ROUND / (width * CELL)) * 100}% / ${(BOARD_ROUND / (height * CELL)) * 100}%`,
          bgcolor: "rgba(10, 8, 36, 0.78)",
          backdropFilter: "blur(6px)",
          // the frame takes the colour of whoever is to move, so the board itself says whose turn it is
          border: `1.5px solid ${alpha(turnColour, 0.6)}`,
          boxShadow: `0 0 26px ${alpha(turnColour, 0.32)}, 0 12px 30px rgba(0, 0, 0, 0.45)`,
          transition: "border-color 300ms ease, box-shadow 300ms ease",
        }}
      >
        <Box component="svg" viewBox={`0 0 ${width * CELL} ${height * CELL}`} aria-hidden sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          <OrbDefs prefix={prefix} />
          {board.owners.map((owner, cell) => {
            const { x, y } = centreOf(state, cell);
            const count = board.orbs[cell];
            const isTense = count > 0 && count === neighboursOf(state, cell).length - 1;
            const isLast = !sending && !flight && state.lastMove?.cell === cell && count > 0;
            const outline = sending?.cell === cell ? turnColour : isLast && colourOf(state, owner);
            return (
              <g key={cell} transform={`translate(${x} ${y})`}>
                <path
                  d={cellOutline(CELL / 2 - GAP, cornersOf(state, cell))}
                  fill={owner === null ? "rgba(255, 255, 255, 0.035)" : alpha(colourOf(state, owner), 0.1)}
                  stroke={outline ? alpha(outline, 0.9) : alpha(turnColour, 0.28)}
                  strokeWidth={outline ? 3.5 : 2}
                />
                {count > 0 && (
                  <Box component="g" sx={isTense && !isStill ? { animation: `${tremble} 0.32s linear infinite` } : undefined}>
                    {spotsFor(count).map(([spotX, spotY], index) => (
                      <Orb key={index} prefix={prefix} tone={toneOf(state, owner)} radius={ORB} x={spotX} y={spotY} />
                    ))}
                  </Box>
                )}
              </g>
            );
          })}
          {flight && <Flight grid={state} flight={flight} prefix={prefix} tone={toneOf(state, flight.seat)} />}
        </Box>

        <Box sx={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${width}, 1fr)`, borderRadius: "inherit", overflow: "hidden" }}>
          {board.owners.map((_, cell) => (
            <ButtonBase
              key={cell}
              disabled={!legal.has(cell)}
              onClick={() => place(cell)}
              aria-label={`Add an orb at row ${Math.floor(cell / width) + 1}, column ${(cell % width) + 1}`}
              sx={{ borderRadius: 2, "&:hover, &.Mui-focusVisible": { bgcolor: alpha(turnColour, 0.16) } }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ChainReactionBoard;
