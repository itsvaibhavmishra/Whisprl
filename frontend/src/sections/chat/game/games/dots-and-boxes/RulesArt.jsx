import { Stack } from "@mui/material";

import { ART, Drawing } from "@/sections/chat/game/games/dots-and-boxes/Board";
import PALETTE from "@/sections/chat/game/games/dots-and-boxes/palette";
import SIZES from "@/sections/chat/game/games/dots-and-boxes/sizes";

const COLOURS = [PALETTE[4], PALETTE[0]];
const INITIALS = ["A", "B"];
const BLUE = 0;
const RED = 1;

// a board smaller than any offered keeps each step easy to read, its lines numbered across first and then down
const SMALL = { width: 3, height: 3 };

const SCENES = {
  aim: {
    lines: [BLUE, RED, null, BLUE, RED, null, BLUE, null, RED, null, null, null, RED, BLUE, BLUE, null, BLUE, RED, null, null, null, null, null, BLUE],
    boxes: [BLUE, BLUE, null, RED, null, null, null, null, null],
  },
  turn: {
    lines: [BLUE, null, null, null, BLUE, null, null, null, null, null, null, null, RED, null, null, null, null, null, RED, null, null, null, null, null],
    boxes: [null, null, null, null, null, null, null, null, null],
  },
  claim: {
    lines: [BLUE, null, null, RED, null, null, null, null, BLUE, null, null, null, RED, BLUE, null, null, null, null, null, null, null, null, null, null],
    boxes: [BLUE, null, null, null, null, null, null, null, null],
  },
  end: {
    lines: [BLUE, RED, BLUE, RED, BLUE, RED, BLUE, RED, BLUE, RED, BLUE, RED, BLUE, BLUE, RED, RED, BLUE, BLUE, BLUE, RED, BLUE, RED, RED, BLUE],
    boxes: [BLUE, BLUE, RED, BLUE, BLUE, RED, RED, RED, BLUE],
  },
};

const Paper = ({ grid, lines, boxes, sx }) => (
  <Drawing grid={grid} lines={lines} boxes={boxes} colourOf={(seat) => COLOURS[seat]} initialOf={(seat) => INITIALS[seat]} sx={sx} />
);

const emptyBoard = (grid) => ({
  grid,
  lines: Array((grid.height + 1) * grid.width + grid.height * (grid.width + 1)).fill(null),
  boxes: Array(grid.width * grid.height).fill(null),
});

// the game's own paper and pencil lines, so the rules look like the board they explain
const DotsAndBoxesRulesArt = ({ picture }) =>
  picture === "sizes" ? (
    <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center" }}>
      {Object.entries(SIZES).map(([size, grid]) => (
        <Paper key={size} {...emptyBoard(grid)} sx={{ flex: grid.width, minWidth: 0 }} />
      ))}
    </Stack>
  ) : (
    <Paper grid={SMALL} {...SCENES[picture]} sx={{ width: `min(100cqw, 100cqh * ${ART.width} / ${ART.height})` }} />
  );

export default DotsAndBoxesRulesArt;
