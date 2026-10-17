// the server's boards, so the picker can show each one before anyone chooses it
export const SIZES = {
  quick: { width: 5, height: 7 },
  standard: { width: 6, height: 9 },
  long: { width: 7, height: 11 },
};

// ten cells a player, the same cap the server enforces when the setting arrives
export const mostPlayersOn = (size) => Math.floor((SIZES[size].width * SIZES[size].height) / 10);
