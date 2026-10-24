import { Box, Stack } from "@mui/material";

import art from "@/sections/chat/game/games/dots-and-boxes/art";
import { ART, Drawing } from "@/sections/chat/game/games/dots-and-boxes/Board";
import PALETTE from "@/sections/chat/game/games/dots-and-boxes/palette";

const COLOURS = [PALETTE[4], PALETTE[0]];
const INITIALS = ["A", "B"];
const BLUE = 0;
const RED = 1;

// the smallest board the game offers, its lines numbered across first and then down, each position one a real game reaches
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

const Paper = ({ size, lines, boxes, sx }) => (
  <Box sx={{ position: "relative", aspectRatio: `${ART.width} / ${ART.height}`, ...sx }}>
    <Box component="img" src={art.board} alt="" sx={{ width: "100%", height: "100%", display: "block" }} />
    <Drawing size={size} lines={lines} boxes={boxes} colourOf={(seat) => COLOURS[seat]} initialOf={(seat) => INITIALS[seat]} />
  </Box>
);

const emptyBoard = (size) => ({ size, lines: Array(2 * size * (size + 1)).fill(null), boxes: Array(size * size).fill(null) });

// the game's own paper and pencil lines, so the rules look like the board they explain
const DotsAndBoxesRulesArt = ({ picture }) =>
  picture === "sizes" ? (
    <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center" }}>
      {[3, 4, 5].map((size) => (
        <Paper key={size} {...emptyBoard(size)} sx={{ flex: 1, minWidth: 0 }} />
      ))}
    </Stack>
  ) : (
    <Paper size={3} {...SCENES[picture]} sx={{ width: `min(100cqw, 100cqh * ${ART.width} / ${ART.height})` }} />
  );

export default DotsAndBoxesRulesArt;
