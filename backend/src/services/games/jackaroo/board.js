// The boards as the rules see them, which the client's layout files must agree with: one loop of holes, where each seat starts, turns home and jumps.
export const HOME_SLOTS = 4;
export const MARBLES = 4;

// marbles run clockwise round the loop, as the client's layout files number it, starting with seat 0 at the bottom
const SINGLE = {
  seats: 2,
  loop: 48,
  start: [0, 24],
  // the hole in front of each home, where a marble turns in
  homeEntry: [46, 22],
  // landing exactly on a swirl jumps the marble across its bay's mouth to the twin
  teleports: { 16: 28, 40: 4 },
  team: [0, 1],
  // each deck is dealt over three rounds of these sizes, then a fresh one comes in
  roundSizes: [4, 4, 5],
  cards: "single",
  // a knock-out or a marble settling home earns one more card
  combo: true,
  // the reference game starts each player with one marble already out
  startsOut: 1,
  // any marble may be jumped, your own too, but only one in a move
  jumpsOwn: true,
  jumpLimit: 1,
};

// turns pass counter-clockwise, against the marbles, so the next seat sits to the right; partners sit opposite, so the teams alternate
const TEAMS = {
  seats: 4,
  loop: 76,
  start: [0, 57, 38, 19],
  homeEntry: [74, 55, 36, 17],
  teleports: {},
  team: [0, 1, 0, 1],
  // the whole deck over three rounds, four players by thirteen cards
  roundSizes: [4, 4, 5],
  cards: "teams",
  combo: false,
  // every marble starts in its base, so an ace or a king is needed to begin
  startsOut: 0,
  // a marble never passes its own player's others, but passes anyone else's
  jumpsOwn: false,
  jumpLimit: Infinity,
};

export const TABLES = { single: SINGLE, teams: TEAMS };

// a game saved before teams existed has no mode, and is one against one
export const tableOf = (state) => TABLES[state.mode ?? "single"];
