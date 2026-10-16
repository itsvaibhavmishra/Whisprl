import { Box } from "@mui/material";

// a stack of offset copies behind the face reads as a solid side, so a mark sits on the stone rather than printed on it
const DEPTHS = [6, 5, 4, 3, 2, 1];

const SHAPES = [<path d="M20 20L80 80M80 20L20 80" />, <circle cx="50" cy="50" r="31" />];

const FACES = [
  { face: "#6B4FF7", side: "#4024BE", lit: "#AC9DFF" },
  { face: "#F45762", side: "#BF2B39", lit: "#FFA7AD" },
];

const Mark = ({ seat, isGhost = false }) => {
  const shape = SHAPES[seat];
  const { face, side, lit } = FACES[seat];

  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      aria-hidden
      sx={{
        width: "100%",
        height: "100%",
        overflow: "visible",
        opacity: isGhost ? 0.35 : 1,
        filter: isGhost ? "none" : "drop-shadow(0 4px 3px rgba(74, 40, 120, 0.3))",
      }}
    >
      <g fill="none" strokeWidth={21} strokeLinecap="round">
        {DEPTHS.map((depth) => (
          <g key={depth} transform={`translate(${(depth * 0.75).toFixed(2)} ${depth})`} stroke={side}>
            {shape}
          </g>
        ))}
        <g stroke={face}>{shape}</g>
        <g stroke={lit} strokeWidth={7} opacity={0.55} transform="translate(-1.5 -2.5)">
          {shape}
        </g>
      </g>
    </Box>
  );
};

export default Mark;
