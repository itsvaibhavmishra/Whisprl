import { boltPath, seeded } from "@/sections/chat/game/games/chain-reaction/lightning";

const LIGHT = { mixBlendMode: "screen" };

// only in the open sky between the arch and the logo, the one patch clear of the planets, the rings and the game's bar
const BOLTS = [
  { from: [176, 100], to: [226, 182], forks: 1, seconds: 10, begin: 2.5, seed: 3 },
  { from: [236, 96], to: [184, 170], forks: 0, seconds: 13, begin: 7, seed: 8 },
];

// light inside a cloud with no bolt at all, which is what most lightning in a cloud looks like
const FLASHES = [
  { x: 196, y: 232, width: 62, height: 40, seconds: 16, begin: 10 },
  { x: 372, y: 110, width: 44, height: 26, seconds: 19, begin: 4 },
];

// dark for almost all of its clock, then a soft double flicker and gone
const STRIKE = { values: "0;0;0.8;0.15;0.55;0;0", keyTimes: "0;0.9;0.905;0.915;0.925;0.945;1" };

const strike = (seconds, begin) => <animate attributeName="opacity" {...STRIKE} dur={`${seconds}s`} begin={`${begin}s`} repeatCount="indefinite" />;

const Bolt = ({ bolt }) => {
  const random = seeded(bolt.seed);
  const trunk = boltPath(random, bolt.from, bolt.to, 6, 9);
  const forks = Array.from({ length: bolt.forks }, () => {
    const branchFrom = [bolt.from[0] + (bolt.to[0] - bolt.from[0]) * 0.45, bolt.from[1] + (bolt.to[1] - bolt.from[1]) * 0.45];
    return boltPath(random, branchFrom, [branchFrom[0] + (random() * 2 - 1) * 30, branchFrom[1] + 22 + random() * 18], 3, 5);
  });

  return (
    <g opacity="0" style={LIGHT}>
      {strike(bolt.seconds, bolt.begin)}
      <ellipse cx={(bolt.from[0] + bolt.to[0]) / 2} cy={(bolt.from[1] + bolt.to[1]) / 2} rx="70" ry="50" fill="url(#zap-sky)" />
      {[trunk, ...forks].map((path, index) => (
        <g key={path}>
          <path d={path} fill="none" stroke="#B9A4FF" strokeWidth={index ? 3.5 : 6} strokeLinecap="round" strokeLinejoin="round" opacity="0.22" />
          <path d={path} fill="none" stroke="#EDE6FF" strokeWidth={index ? 0.8 : 1.2} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        </g>
      ))}
    </g>
  );
};

// lightning now and then in the open sky, faint enough to notice only once in a while
const SkyZaps = () => (
  <g aria-hidden>
    <defs>
      <radialGradient id="zap-sky">
        <stop offset="0" stopColor="#B49BFF" stopOpacity="0.3" />
        <stop offset="1" stopColor="#A98BFF" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="zap-cloud">
        <stop offset="0" stopColor="#D2C2FF" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#B49BFF" stopOpacity="0.22" />
        <stop offset="1" stopColor="#A98BFF" stopOpacity="0" />
      </radialGradient>
    </defs>
    {BOLTS.map((bolt) => (
      <Bolt key={bolt.seed} bolt={bolt} />
    ))}
    {FLASHES.map((flash) => (
      <g key={flash.x} opacity="0" style={LIGHT}>
        {strike(flash.seconds, flash.begin)}
        <ellipse cx={flash.x} cy={flash.y} rx={flash.width} ry={flash.height} fill="url(#zap-cloud)" />
      </g>
    ))}
  </g>
);

export default SkyZaps;
