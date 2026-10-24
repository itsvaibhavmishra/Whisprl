import { useId } from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { CELL, Cell, centreOf, frameOf, ORB, Orbs } from "@/sections/chat/game/games/chain-reaction/Board";
import Orb, { OrbDefs } from "@/sections/chat/game/games/chain-reaction/Orb";
import PALETTE from "@/sections/chat/game/games/chain-reaction/palette";

const RED = 0;
const BLUE = 3;
const GRID = { width: 3, height: 3 };
const MIDDLE = 4;
const NEIGHBOURS = [1, 3, 5, 7];
const YOU = PALETTE[RED];

// a three by three board has every kind of cell; each position is one a real game reaches, bar the full cells on Bursting
const SCENES = {
  aim: { owners: [RED, null, BLUE, RED, RED, null, null, BLUE, BLUE], orbs: [1, 0, 1, 2, 1, 0, 0, 1, 1] },
  turn: { owners: [RED, null, BLUE, null, RED, null, null, null, BLUE], orbs: [1, 0, 1, 0, 1, 0, 0, 0, 1], marked: [1, 4], ghost: 1 },
  burst: { owners: [RED, null, null, null, RED, null, null, RED, null], orbs: [2, 0, 0, 0, 4, 0, 0, 3, 0], marked: [0, 4, 7] },
  chain: { owners: [null, BLUE, null, RED, null, BLUE, null, null, null], orbs: [0, 2, 0, 1, 0, 2, 0, 0, 0], marked: [MIDDLE] },
  end: { owners: [null, null, RED, RED, RED, RED, null, RED, RED], orbs: [0, 0, 1, 2, 3, 1, 0, 1, 1] },
};

// the middle cell's four orbs caught on their way out, each with the trail it leaves behind
const Burst = ({ prefix }) => {
  const from = centreOf(GRID, MIDDLE);
  return NEIGHBOURS.map((neighbour) => {
    const to = centreOf(GRID, neighbour);
    const midX = from.x + (to.x - from.x) / 2;
    const midY = from.y + (to.y - from.y) / 2;
    return (
      <g key={neighbour}>
        <line x1={from.x} y1={from.y} x2={midX} y2={midY} stroke={alpha(YOU, 0.45)} strokeWidth={6} strokeLinecap="round" />
        <Orb prefix={prefix} tone={RED} radius={ORB} x={midX} y={midY} />
      </g>
    );
  });
};

// the game's own night board and glowing orbs, so the rules look like the board they explain
const ChainReactionRulesArt = ({ picture }) => {
  const prefix = `crr${useId().replace(/:/g, "")}`;
  const { owners, orbs, marked = [], ghost } = SCENES[picture];
  return (
    <Box sx={{ ...frameOf(GRID, YOU), width: "min(100cqw, 100cqh)" }}>
      <Box
        component="svg"
        viewBox={`0 0 ${GRID.width * CELL} ${GRID.height * CELL}`}
        aria-hidden
        sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
      >
        <OrbDefs prefix={prefix} />
        {owners.map((owner, cell) => (
          <Cell
            key={cell}
            grid={GRID}
            cell={cell}
            colour={owner === null ? null : PALETTE[owner]}
            stroke={marked.includes(cell) ? alpha(YOU, 0.9) : alpha(YOU, 0.28)}
            strokeWidth={marked.includes(cell) ? 3.5 : 2}
          >
            {orbs[cell] > 0 && <Orbs count={orbs[cell]} prefix={prefix} tone={owner} />}
            {cell === ghost && (
              <g opacity={0.45}>
                <Orb prefix={prefix} tone={RED} radius={ORB} />
              </g>
            )}
          </Cell>
        ))}
        {picture === "chain" && <Burst prefix={prefix} />}
      </Box>
    </Box>
  );
};

export default ChainReactionRulesArt;
