import { useId, useState } from "react";
import { Box, ButtonBase } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { m, useReducedMotion } from "framer-motion";

import { neighboursOf, placedOn, totalOf } from "@/sections/chat/game/games/chain-reaction/cascade";
import Orb, { OrbDefs } from "@/sections/chat/game/games/chain-reaction/Orb";
import { colourOf, toneOf } from "@/sections/chat/game/games/chain-reaction/palette";
import useCascade from "@/sections/chat/game/games/chain-reaction/useCascade";

// the board's own units: a cell is a hundred across, so everything inside one is a share of that
const CELL = 100;
const GAP = 4;
const ORB = 17;
const SPREAD = 19;
const MAX_WIDTH = 560;

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
  const [pending, setPending] = useState(null);
  if (!state) return null;
  // a new game on another size arrives a render before the cascade catches up, and its old board would not fit
  const fitted = cascade.board?.orbs.length === state.orbs.length ? cascade.board : state;
  // the tapped orb shows at once and stays until the count moves on, by the server's answer or the bot playing the turn instead
  const placing = pending?.moves === totalOf(state) ? pending : null;
  const board = placing ? placedOn(fitted, placing.cell, placing.seat) : fitted;
  const { flight } = cascade;

  const { width, height } = state;
  const turnColour = colourOf(state, state.turn);
  const legal = new Set(placing ? [] : state.legalMoves ?? []);

  const place = async (cell) => {
    setPending({ cell, seat: state.turn, moves: totalOf(state) });
    const result = await onMove(cell);
    if (result?.meta?.requestStatus === "rejected") setPending(null);
  };

  return (
    // measured against both sides of the space it is given, so a short panel shrinks the board instead of clipping it
    <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: { xs: 1.5, sm: 2 }, containerType: "size" }}>
      <Box
        sx={{
          position: "relative",
          aspectRatio: `${width} / ${height}`,
          width: `min(${MAX_WIDTH}px, 100cqw, 100cqh * ${width} / ${height})`,
          borderRadius: 3,
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
            const isLast = !flight && state.lastMove?.cell === cell && count > 0;
            return (
              <g key={cell} transform={`translate(${x} ${y})`}>
                <rect
                  x={-CELL / 2 + GAP}
                  y={-CELL / 2 + GAP}
                  width={CELL - GAP * 2}
                  height={CELL - GAP * 2}
                  rx={14}
                  fill={owner === null ? "rgba(255, 255, 255, 0.035)" : alpha(colourOf(state, owner), 0.1)}
                  stroke={isLast ? alpha(colourOf(state, owner), 0.9) : alpha(turnColour, 0.28)}
                  strokeWidth={isLast ? 3.5 : 2}
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

        <Box sx={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${width}, 1fr)` }}>
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
