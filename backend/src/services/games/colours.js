// the client holds the actual colours; a board only decides which of them each seat gets
export const PALETTE_SIZE = 6;

// teal, blue and purple sit next to each other in the palette and look alike on a marble, so one table never gets two of them side by side
const ALIKE = [
  [3, 4],
  [4, 5],
];

const isDistinct = (colours) => !ALIKE.some(([one, other]) => colours.includes(one) && colours.includes(other));

const shuffled = (items, random) =>
  items.reduce((order, item) => {
    const at = Math.floor(random() * (order.length + 1));
    return [...order.slice(0, at), item, ...order.slice(at)];
  }, []);

// two or three players are spread evenly round the palette; a bigger table draws at random, avoiding look-alikes while it can
export const dealtColours = (players, random = Math.random) => {
  const step = Math.max(1, Math.floor(PALETTE_SIZE / players));
  if (step > 1) {
    const start = Math.floor(random() * PALETTE_SIZE);
    return Array.from({ length: players }, (_, seat) => (start + seat * step) % PALETTE_SIZE);
  }
  const palette = Array.from({ length: PALETTE_SIZE }, (_, colour) => colour);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const colours = shuffled(palette, random).slice(0, players);
    if (isDistinct(colours)) return colours;
  }
  return shuffled(palette, random).slice(0, players);
};

// a colour belongs to a seat for as long as the same people are sitting in it
export const coloursFor = (previous, players, seating) => {
  const kept = previous?.seating === seating && previous.colours?.length === players;
  return kept ? previous.colours : dealtColours(players);
};
