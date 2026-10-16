import { Box } from "@mui/material";

const SIZE = 300;
const THIRD = SIZE / 3;
const INSET = 26;
// past the outer squares' centres, so the winning stroke reads as crossing the whole row
const OVERSHOOT = 0.35;

// slightly bowed lines, so the grid reads as chalk rather than a table
const GRID = [
  `M ${THIRD} 14 Q ${THIRD + 4} ${SIZE / 2} ${THIRD - 2} ${SIZE - 12}`,
  `M ${2 * THIRD} 12 Q ${2 * THIRD - 3} ${SIZE / 2} ${2 * THIRD + 2} ${SIZE - 14}`,
  `M 12 ${THIRD + 1} Q ${SIZE / 2} ${THIRD - 4} ${SIZE - 14} ${THIRD + 2}`,
  `M 14 ${2 * THIRD} Q ${SIZE / 2} ${2 * THIRD + 4} ${SIZE - 12} ${2 * THIRD - 1}`,
];

const cornerOf = (cell) => ({ left: (cell % 3) * THIRD, top: Math.floor(cell / 3) * THIRD });

const centreOf = (cell) => {
  const { left, top } = cornerOf(cell);
  return { x: left + THIRD / 2, y: top + THIRD / 2 };
};

const Cross = ({ cell, color }) => {
  const { left, top } = cornerOf(cell);
  const near = INSET;
  const far = THIRD - INSET;
  return (
    <path
      d={`M ${left + near} ${top + near + 2} L ${left + far} ${top + far} M ${left + far - 1} ${top + near} L ${left + near + 2} ${top + far}`}
      stroke={color}
    />
  );
};

const Nought = ({ cell, color }) => {
  const { x, y } = centreOf(cell);
  return <ellipse cx={x} cy={y} rx={THIRD / 2 - INSET} ry={THIRD / 2 - INSET - 2} stroke={color} />;
};

const MARKS = [Cross, Nought];

const WinningStroke = ({ line, color }) => {
  const start = centreOf(line[0]);
  const end = centreOf(line[2]);
  const reachX = (end.x - start.x) * OVERSHOOT;
  const reachY = (end.y - start.y) * OVERSHOOT;
  return <path d={`M ${start.x - reachX} ${start.y - reachY} L ${end.x + reachX} ${end.y + reachY}`} stroke={color} strokeWidth={9} />;
};

const NAMES = ["top left", "top", "top right", "left", "centre", "right", "bottom left", "bottom", "bottom right"];

const OpenSquare = ({ cell, mark, color, onMove }) => {
  const Mark = MARKS[mark];
  const { left, top } = cornerOf(cell);
  const take = () => onMove(cell);
  return (
    <Box
      component="g"
      role="button"
      tabIndex={0}
      aria-label={`Play the ${NAMES[cell]} square`}
      onClick={take}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        take();
      }}
      sx={{ cursor: "pointer", outline: "none", "& .ghost": { opacity: 0, transition: "opacity 120ms ease" }, "&:hover .ghost, &:focus-visible .ghost": { opacity: 0.35 } }}
    >
      <rect x={left} y={top} width={THIRD} height={THIRD} fill="transparent" stroke="none" />
      <g className="ghost">
        <Mark cell={cell} color={color} />
      </g>
    </Box>
  );
};

const TicTacToeBoard = ({ state, theme, dimmed = false, onMove }) => (
  <Box
    component="svg"
    viewBox={`0 0 ${SIZE} ${SIZE}`}
    aria-label="Tic-tac-toe board"
    sx={{ width: "100%", height: "100%", maxWidth: 360, maxHeight: 360, opacity: dimmed ? 0.45 : 1, transition: "opacity 300ms ease" }}
  >
    <g fill="none" strokeLinecap="round" strokeWidth={7}>
      {GRID.map((line) => (
        <path key={line} d={line} stroke={theme.ink} opacity={0.85} />
      ))}
      {(state?.board ?? []).map((mark, cell) => {
        if (mark === null) return null;
        const Mark = MARKS[mark];
        return <Mark key={cell} cell={cell} color={theme.marks[mark]} />;
      })}
      {state?.line && <WinningStroke line={state.line} color={theme.ink} />}
      {(state?.legalMoves ?? []).map((cell) => (
        <OpenSquare key={cell} cell={cell} mark={state.turn} color={theme.marks[state.turn]} onMove={onMove} />
      ))}
    </g>
  </Box>
);

export default TicTacToeBoard;
