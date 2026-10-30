import { Box, ButtonBase } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import art from "@/sections/chat/game/games/dots-and-boxes/art";
import { colourOf } from "@/sections/chat/game/games/dots-and-boxes/palette";
import { memberOf } from "@/utils/groups";

// the board artwork's own pixels, so lines are placed in its coordinates and never stretched
export const ART = { width: 1152, height: 1092 };
// where the paper's playable area sits inside the artwork, measured off the board
const INSET = 0.13;
const SPAN = 0.74;
// the plain band of paper between these heights is what grows on a board taller than it is wide
const STRETCH_FROM = 330;
const STRETCH_TO = 760;
const MAX_WIDTH = 520;
const glowIn = keyframes`from { opacity: 0.8; } to { opacity: 0.35; }`;

const stepOf = ({ width }) => (ART.width * SPAN) / width;
const rowStepOf = ({ width }) => (ART.height * SPAN) / width;

// each extra row adds a row's worth of paper, so a tall board's boxes keep the shape a square board's have
const heightOf = (grid) => ART.height + rowStepOf(grid) * (grid.height - grid.width);

const dotAt = (grid, row, col) => [ART.width * INSET + col * stepOf(grid), ART.height * INSET + row * rowStepOf(grid)];

// the same numbering the rules use: every line across the board first, then every line down it
const lineAt = ({ width, height }, line) => {
  const acrossCount = (height + 1) * width;
  if (line < acrossCount) return { isAcross: true, row: Math.floor(line / width), col: line % width };
  const down = line - acrossCount;
  return { isAcross: false, row: Math.floor(down / (width + 1)), col: down % (width + 1) };
};

const endsOf = (grid, line) => {
  const { isAcross, row, col } = lineAt(grid, line);
  return [dotAt(grid, row, col), isAcross ? dotAt(grid, row, col + 1) : dotAt(grid, row + 1, col)];
};

const Slice = ({ from, to, top, height }) => (
  <svg x={0} y={top} width={ART.width} height={height} viewBox={`0 ${from} ${ART.width} ${to - from}`} preserveAspectRatio="none">
    <image href={art.board} width={ART.width} height={ART.height} />
  </svg>
);

// the paper's top and bottom stay as drawn and only the plain band between them grows, so a tall board keeps its corners
const Paper = ({ grid }) => {
  const grown = heightOf(grid) - ART.height;
  if (!grown) return <image href={art.board} width={ART.width} height={ART.height} />;
  return (
    <>
      {/* a pixel over each join, so no seam of the desk shows between the pieces */}
      <Slice from={STRETCH_FROM} to={STRETCH_TO} top={STRETCH_FROM - 1} height={STRETCH_TO - STRETCH_FROM + grown + 2} />
      <Slice from={0} to={STRETCH_FROM} top={0} height={STRETCH_FROM} />
      <Slice from={STRETCH_TO} to={ART.height} top={STRETCH_TO + grown} height={ART.height - STRETCH_TO} />
    </>
  );
};

// a real name rather than "You", so a box reads the same letter to everyone at the table
const initialOf = (seat, conversation) => {
  if (!seat) return "";
  if (seat.bot && !seat.user) return "B";
  const member = seat.user && memberOf(conversation, seat.user);
  return (member?.firstName ?? "").charAt(0).toUpperCase();
};

const labelFor = (grid, line) => {
  const { isAcross, row, col } = lineAt(grid, line);
  return `Draw the ${isAcross ? "across" : "down"} line at row ${row + 1}, column ${col + 1}`;
};

// the artwork is not square, so a box takes its height from the dots below it rather than from its width
const Claimed = ({ grid, box, colour, initial }) => {
  const row = Math.floor(box / grid.width);
  const col = box % grid.width;
  const [left, top] = dotAt(grid, row, col);
  const [right, bottom] = dotAt(grid, row + 1, col + 1);
  const step = stepOf(grid);

  return (
    <g>
      <rect x={left} y={top} width={right - left} height={bottom - top} fill={colour} opacity={0.22} rx={step * 0.08} />
      <text x={(left + right) / 2} y={(top + bottom) / 2} fill={colour} fontSize={step * 0.44} fontWeight={800} textAnchor="middle" dominantBaseline="central">
        {initial}
      </text>
    </g>
  );
};

// the line drawn last glows in its drawer's colour, so a move made while looking away is still easy to find
const LastLine = ({ grid, line, colour }) => {
  const [[fromX, fromY], [toX, toY]] = endsOf(grid, line);
  return (
    <Box
      component="line"
      x1={fromX}
      y1={fromY}
      x2={toX}
      y2={toY}
      stroke={colour}
      strokeWidth={stepOf(grid) * 0.3}
      strokeLinecap="round"
      sx={{ opacity: 0.35, animation: `${glowIn} 700ms ease-out`, "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
    />
  );
};

export const Drawing = ({ grid, lines, boxes, lastLine = null, colourOf, initialOf, sx }) => {
  const step = stepOf(grid);
  return (
    <Box component="svg" viewBox={`0 0 ${ART.width} ${heightOf(grid)}`} aria-hidden sx={{ display: "block", width: "100%", ...sx }}>
      <Paper grid={grid} />
      {boxes.map((owner, box) => (owner === null ? null : <Claimed key={box} grid={grid} box={box} colour={colourOf(owner)} initial={initialOf(owner)} />))}
      {lastLine !== null && <LastLine key={lastLine} grid={grid} line={lastLine} colour={colourOf(lines[lastLine])} />}
      {lines.map((drawnBy, line) => {
        const [[fromX, fromY], [toX, toY]] = endsOf(grid, line);
        const isDrawn = drawnBy !== null;
        return (
          <line
            key={line}
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke={isDrawn ? colourOf(drawnBy) : "rgba(74, 51, 33, 0.22)"}
            strokeWidth={isDrawn ? step * 0.1 : step * 0.035}
            strokeLinecap="round"
            strokeDasharray={isDrawn ? undefined : `${step * 0.1} ${step * 0.12}`}
          />
        );
      })}
      {Array.from({ length: (grid.height + 1) * (grid.width + 1) }, (_, dot) => {
        const [cx, cy] = dotAt(grid, Math.floor(dot / (grid.width + 1)), dot % (grid.width + 1));
        return <circle key={dot} cx={cx} cy={cy} r={step * 0.065} fill="#3A2E4A" />;
      })}
    </Box>
  );
};

const DotsAndBoxesBoard = ({ state, seats, conversation, onMove }) => {
  if (!state) return null;
  const { lines, boxes, lastLine } = state;
  const grid = { width: state.width, height: state.height };
  const height = heightOf(grid);
  const step = stepOf(grid);
  const open = state.legalMoves ?? [];
  const turnColour = colourOf(state, state.turn);

  return (
    // measured against both sides of the space it is given, so a short panel shrinks the board instead of clipping it
    <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: { xs: 1.5, sm: 2 }, containerType: "size" }}>
      <Box sx={{ position: "relative", width: `min(${MAX_WIDTH}px, 100cqw, 100cqh * ${ART.width} / ${height})` }}>
        <Drawing
          grid={grid}
          lines={lines}
          boxes={boxes}
          lastLine={lastLine}
          colourOf={(seat) => colourOf(state, seat)}
          initialOf={(seat) => initialOf(seats?.[seat], conversation)}
          sx={{ filter: "drop-shadow(0 10px 22px rgba(60,38,20,0.32))" }}
        />

        {open.map((line) => {
          const [[fromX, fromY], [toX, toY]] = endsOf(grid, line);
          const { isAcross } = lineAt(grid, line);
          const grab = step * 0.24;
          return (
            <ButtonBase
              key={line}
              onClick={() => onMove(line)}
              aria-label={labelFor(grid, line)}
              sx={{
                position: "absolute",
                left: `${((Math.min(fromX, toX) - (isAcross ? 0 : grab)) / ART.width) * 100}%`,
                top: `${((Math.min(fromY, toY) - (isAcross ? grab : 0)) / height) * 100}%`,
                width: `${((isAcross ? Math.abs(toX - fromX) : grab * 2) / ART.width) * 100}%`,
                height: `${((isAcross ? grab * 2 : Math.abs(toY - fromY)) / height) * 100}%`,
                borderRadius: 99,
                "&:hover, &.Mui-focusVisible": { bgcolor: `${turnColour}2E` },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};

export default DotsAndBoxesBoard;
