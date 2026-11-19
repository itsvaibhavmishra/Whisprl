import { useId, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { lighten } from "@mui/material/styles";

// a plaque with scooped corners and a point on each side, drawn at its real size so neither ever stretches
const plaque = ({ x, y, width, height, scoop, point, pointHalf }) => {
  const left = x + point;
  const right = x + width - point;
  const bottom = y + height;
  const middle = y + height / 2;
  return [
    `M${left + scoop} ${y}H${right - scoop}A${scoop} ${scoop} 0 0 0 ${right} ${y + scoop}`,
    `V${middle - pointHalf}L${x + width} ${middle}L${right} ${middle + pointHalf}`,
    `V${bottom - scoop}A${scoop} ${scoop} 0 0 0 ${right - scoop} ${bottom}H${left + scoop}A${scoop} ${scoop} 0 0 0 ${left} ${bottom - scoop}`,
    `V${middle + pointHalf}L${x} ${middle}L${left} ${middle - pointHalf}V${y + scoop}A${scoop} ${scoop} 0 0 0 ${left + scoop} ${y}Z`,
  ].join("");
};

const inset = (shape, by) => ({
  x: shape.x + by,
  y: shape.y + by,
  width: shape.width - by * 2,
  height: shape.height - by * 2,
  scoop: Math.max(2, shape.scoop - by * 0.6),
  point: Math.max(1, shape.point - by * 0.4),
  pointHalf: Math.max(4, shape.pointHalf - by * 0.8),
});

const BannerFrame = ({ colour }) => {
  const id = useId();
  const svgRef = useRef(null);
  const [size, setSize] = useState(null);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  const rim = size && { x: 0, y: 0, width: size.width, height: size.height, scoop: 12, point: 7, pointHalf: 13 };
  const face = rim && inset(rim, 2.5);
  const line = rim && inset(rim, 6.5);

  return (
    <Box
      component="svg"
      ref={svgRef}
      aria-hidden
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", filter: "drop-shadow(0 4px 6px rgba(40, 30, 80, 0.16))" }}
    >
      {size && (
        <>
          <defs>
            <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFEDC4" />
              <stop offset="1" stopColor="#EDBE6E" />
            </linearGradient>
            <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={lighten(colour, 0.08)} />
              <stop offset="1" stopColor={colour} />
            </linearGradient>
            <clipPath id={`${id}-clip`}>
              <path d={plaque(face)} />
            </clipPath>
          </defs>
          <path d={plaque(rim)} fill={`url(#${id}-rim)`} />
          <path d={plaque(face)} fill={`url(#${id}-face)`} />
          <g clipPath={`url(#${id}-clip)`} fill={lighten(colour, 0.22)} opacity={0.35}>
            <circle cx={size.width * 0.74} cy={size.height * 1.05} r={size.height * 0.5} />
            <circle cx={size.width * 0.9} cy={size.height * 0.12} r={size.height * 0.26} />
          </g>
          <path d={plaque(line)} fill="none" stroke="#FFE2A6" strokeOpacity={0.75} strokeWidth={1.2} />
        </>
      )}
    </Box>
  );
};

export default BannerFrame;
