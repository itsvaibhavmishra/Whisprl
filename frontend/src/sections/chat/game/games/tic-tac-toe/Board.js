import { Box, ButtonBase } from "@mui/material";

import art from "@/sections/chat/game/games/tic-tac-toe/art";
import Mark from "@/sections/chat/game/games/tic-tac-toe/Marks";
import layout from "@/sections/chat/game/games/tic-tac-toe/tiles.json";

const [ART_WIDTH, ART_HEIGHT] = layout.board;
// the board's own proportions, used to keep a mark square inside a tile that is not
const SQUARE = ART_HEIGHT / ART_WIDTH;
const MARK = 0.62;
const MAX_WIDTH = 460;

const NAMES = ["top left", "top", "top right", "left", "centre", "right", "bottom left", "bottom", "bottom right"];

const tileOf = (cell) => layout.tiles[Math.floor(cell / 3)][cell % 3];

const centreOf = (cell) => {
  const tile = tileOf(cell);
  return [tile.left + tile.width / 2, tile.top + tile.height / 2];
};

export const boxOf = (cell) => {
  const tile = tileOf(cell);
  const [cx, cy] = centreOf(cell);
  const width = MARK * Math.min(tile.width, tile.height * SQUARE);
  const height = width / SQUARE;
  return { position: "absolute", left: `${cx - width / 2}%`, top: `${cy - height / 2}%`, width: `${width}%`, height: `${height}%` };
};

export const WinningLine = ({ line }) => {
  const [fromX, fromY] = centreOf(line[0]);
  const [toX, toY] = centreOf(line[2]);
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 0 7px rgba(255,255,255,0.95)) drop-shadow(0 2px 4px rgba(74,40,120,0.45))" }}
    >
      <path d={`M${fromX} ${fromY} L${toX} ${toY}`} stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" />
    </Box>
  );
};

const TicTacToeBoard = ({ state, onMove }) => {
  const board = state?.board ?? [];
  const moves = state?.legalMoves ?? [];

  return (
    // measured against both sides of the space it is given, so a short panel shrinks the board instead of clipping it
    <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: { xs: 1.5, sm: 2 }, containerType: "size" }}>
      <Box
        sx={{
          position: "relative",
          aspectRatio: `${ART_WIDTH} / ${ART_HEIGHT}`,
          width: `min(${MAX_WIDTH}px, 100cqw, 100cqh * ${ART_WIDTH} / ${ART_HEIGHT})`,
        }}
      >
        <Box component="img" src={art.board} alt="" sx={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 10px 20px rgba(70,40,110,0.3))" }} />
        {board.map((seat, cell) => seat !== null && (
          <Box key={cell} sx={boxOf(cell)}>
            <Mark seat={seat} />
          </Box>
        ))}
        {moves.map((cell) => (
          <ButtonBase
            key={cell}
            aria-label={`Play the ${NAMES[cell]} square`}
            onClick={() => onMove(cell)}
            sx={{ ...boxOf(cell), borderRadius: "22%", "& .ghost": { opacity: 0, transition: "opacity 120ms ease" }, "&:hover .ghost, &:focus-visible .ghost": { opacity: 1 } }}
          >
            <Box className="ghost" sx={{ width: "100%", height: "100%" }}>
              <Mark seat={state.turn} isGhost />
            </Box>
          </ButtonBase>
        ))}
        {state?.line && <WinningLine line={state.line} />}
      </Box>
    </Box>
  );
};

export default TicTacToeBoard;
