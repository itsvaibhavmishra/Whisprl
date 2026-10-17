// the same seed always draws the same bolt, so a bolt keeps its shape from one render to the next
export const seeded = (seed) => {
  let state = (seed * 9301 + 49297) % 233280 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
};

// a jagged line from one point to another, each kink pushed off to the side by up to the spread
export const boltPath = (random, [fromX, fromY], [toX, toY], kinks, spread) => {
  const length = Math.hypot(toX - fromX, toY - fromY);
  const [alongX, alongY] = [(toX - fromX) / length, (toY - fromY) / length];
  const points = [[fromX, fromY]];
  for (let kink = 1; kink < kinks; kink += 1) {
    const share = kink / kinks;
    const push = (random() * 2 - 1) * spread;
    points.push([fromX + (toX - fromX) * share - alongY * push, fromY + (toY - fromY) * share + alongX * push]);
  }
  points.push([toX, toY]);
  return points.map(([pointX, pointY], index) => `${index ? "L" : "M"}${pointX.toFixed(2)} ${pointY.toFixed(2)}`).join(" ");
};
