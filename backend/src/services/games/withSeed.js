// replays bot games with the same luck every time, so a test's win rate never wobbles from run to run
export const withSeed = (seed, run) => {
  const real = Math.random;
  let current = seed;
  Math.random = () => {
    current = (current + 0x6d2b79f5) | 0;
    let mixed = Math.imul(current ^ (current >>> 15), 1 | current);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  try {
    return run();
  } finally {
    Math.random = real;
  }
};
