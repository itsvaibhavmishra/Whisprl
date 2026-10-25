import { Box, ButtonBase } from "@mui/material";

import art from "@/sections/chat/game/games/dots-and-boxes/art";
import { colourOf } from "@/sections/chat/game/games/dots-and-boxes/palette";
import { memberOf } from "@/utils/groups";

// the board artwork's own pixels, so lines are placed in its coordinates and never stretched
export const ART = { width: 1152, height: 1092 };
// where the paper's playable area sits inside the artwork, measured off the board
const INSET = 0.13;
const SPAN = 0.74;
const MAX_WIDTH = 520;

const dotAt = (size, row, col) => [ART.width * (INSET + (col * SPAN) / size), ART.height * (INSET + (row * SPAN) / size)];

// the same numbering the rules use: every line across the board first, then every line down it
const lineAt = (size, line) => {
  const acrossCount = (size + 1) * size;
  if (line < acrossCount) return { isAcross: true, row: Math.floor(line / size), col: line % size };
  const down = line - acrossCount;
  return { isAcross: false, row: Math.floor(down / (size + 1)), col: down % (size + 1) };
};

const endsOf = (size, line) => {
  const { isAcross, row, col } = lineAt(size, line);
  return [dotAt(size, row, col), isAcross ? dotAt(size, row, col + 1) : dotAt(size, row + 1, col)];
};

const stepOf = (size) => (ART.width * SPAN) / size;

// a real name rather than "You", so a box reads the same letter to everyone at the table
const initialOf = (seat, conversation) => {
  if (!seat) return "";
  if (seat.bot && !seat.user) return "B";
  const member = seat.user && memberOf(conversation, seat.user);
  return (member?.firstName ?? "").charAt(0).toUpperCase();
};

const labelFor = (size, line) => {
  const { isAcross, row, col } = lineAt(size, line);
  return `Draw the ${isAcross ? "across" : "down"} line at row ${row + 1}, column ${col + 1}`;
};

// the artwork is not square, so a box takes its height from the dots below it rather than from its width
const Claimed = ({ size, box, colour, initial }) => {
  const row = Math.floor(box / size);
  const col = box % size;
  const [left, top] = dotAt(size, row, col);
  const [right, bottom] = dotAt(size, row + 1, col + 1);
  const step = stepOf(size);

  return (
    <g>
      <rect x={left} y={top} width={right - left} height={bottom - top} fill={colour} opacity={0.22} rx={step * 0.08} />
      <text x={(left + right) / 2} y={(top + bottom) / 2} fill={colour} fontSize={step * 0.44} fontWeight={800} textAnchor="middle" dominantBaseline="central">
        {initial}
      </text>
    </g>
  );
};

export const Drawing = ({ size, lines, boxes, colourOf, initialOf }) => {
  const step = stepOf(size);
  return (
    <Box component="svg" viewBox={`0 0 ${ART.width} ${ART.height}`} aria-hidden sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {boxes.map((owner, box) => (owner === null ? null : <Claimed key={box} size={size} box={box} colour={colourOf(owner)} initial={initialOf(owner)} />))}
      {lines.map((drawnBy, line) => {
        const [[fromX, fromY], [toX, toY]] = endsOf(size, line);
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
      {Array.from({ length: (size + 1) * (size + 1) }, (_, dot) => {
        const [cx, cy] = dotAt(size, Math.floor(dot / (size + 1)), dot % (size + 1));
        return <circle key={dot} cx={cx} cy={cy} r={step * 0.065} fill="#3A2E4A" />;
      })}
    </Box>
  );
};

const DotsAndBoxesBoard = ({ state, seats, conversation, onMove }) => {
  if (!state) return null;
  const { size, lines, boxes } = state;
  const step = stepOf(size);
  const open = state.legalMoves ?? [];
  const turnColour = colourOf(state, state.turn);

  return (
    // measured against both sides of the space it is given, so a short panel shrinks the board instead of clipping it
    <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: { xs: 1.5, sm: 2 }, containerType: "size" }}>
      <Box
        sx={{
          position: "relative",
          aspectRatio: `${ART.width} / ${ART.height}`,
          width: `min(${MAX_WIDTH}px, 100cqw, 100cqh * ${ART.width} / ${ART.height})`,
        }}
      >
        <Box
          component="img"
          src={art.board}
          alt=""
          sx={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 10px 22px rgba(60,38,20,0.32))" }}
        />

        <Drawing
          size={size}
          lines={lines}
          boxes={boxes}
          colourOf={(seat) => colourOf(state, seat)}
          initialOf={(seat) => initialOf(seats?.[seat], conversation)}
        />

        {open.map((line) => {
          const [[fromX, fromY], [toX, toY]] = endsOf(size, line);
          const { isAcross } = lineAt(size, line);
          const grab = step * 0.24;
          return (
            <ButtonBase
              key={line}
              onClick={() => onMove(line)}
              aria-label={labelFor(size, line)}
              sx={{
                position: "absolute",
                left: `${((Math.min(fromX, toX) - (isAcross ? 0 : grab)) / ART.width) * 100}%`,
                top: `${((Math.min(fromY, toY) - (isAcross ? grab : 0)) / ART.height) * 100}%`,
                width: `${((isAcross ? Math.abs(toX - fromX) : grab * 2) / ART.width) * 100}%`,
                height: `${((isAcross ? grab * 2 : Math.abs(toY - fromY)) / ART.height) * 100}%`,
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
