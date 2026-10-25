import { Box } from "@mui/material";

import art from "@/sections/chat/game/games/tic-tac-toe/art";
import { boxOf, WinningLine } from "@/sections/chat/game/games/tic-tac-toe/Board";
import Mark from "@/sections/chat/game/games/tic-tac-toe/Marks";
import layout from "@/sections/chat/game/games/tic-tac-toe/tiles.json";

const [ART_WIDTH, ART_HEIGHT] = layout.board;
const CROSS = 0;
const NOUGHT = 1;

const SCENES = {
  aim: { board: [CROSS, CROSS, CROSS, NOUGHT, null, NOUGHT, null, null, null], line: [0, 1, 2] },
  turn: { board: [NOUGHT, null, null, null, CROSS, null, null, null, null], ghost: 8 },
  end: { board: [CROSS, NOUGHT, CROSS, CROSS, NOUGHT, NOUGHT, NOUGHT, CROSS, CROSS] },
};

// the real board and the real marks, so the rules look like the game they explain
const TicTacToeRulesArt = ({ picture }) => {
  const { board, line, ghost } = SCENES[picture];
  return (
    <Box sx={{ position: "relative", aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}`, width: `min(100cqw, 100cqh * ${ART_WIDTH} / ${ART_HEIGHT})` }}>
      <Box component="img" src={art.board} alt="" sx={{ width: "100%", height: "100%", display: "block" }} />
      {board.map((seat, cell) =>
        seat === null ? null : (
          <Box key={cell} sx={boxOf(cell)}>
            <Mark seat={seat} />
          </Box>
        )
      )}
      {ghost !== undefined && (
        <Box sx={boxOf(ghost)}>
          <Mark seat={CROSS} isGhost />
        </Box>
      )}
      {line && <WinningLine line={line} />}
    </Box>
  );
};

export default TicTacToeRulesArt;
