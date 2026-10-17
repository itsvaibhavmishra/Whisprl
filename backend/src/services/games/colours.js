// the client holds the actual colours; a board only decides which of them each seat gets
export const PALETTE_SIZE = 6;

// spread evenly around the palette from a random start, so two players never draw neighbouring colours
export const dealtColours = (players) => {
  const step = Math.max(1, Math.floor(PALETTE_SIZE / players));
  const start = Math.floor(Math.random() * PALETTE_SIZE);
  return Array.from({ length: players }, (_, seat) => (start + seat * step) % PALETTE_SIZE);
};

// a colour belongs to a seat for as long as the same people are sitting in it
export const coloursFor = (previous, players, seating) => {
  const kept = previous?.seating === seating && previous.colours?.length === players;
  return kept ? previous.colours : dealtColours(players);
};
