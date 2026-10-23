// The board as the rules see it, which the client's layout.json must agree with: one loop of holes, where each seat starts, turns home and jumps.
export const LOOP = 48;
export const HOME_SLOTS = 4;
export const MARBLES = 4;

// seat 0 sits at the bottom of the board and seat 1 at the top; everything here is indexed by seat
export const START = [0, 24];
// the hole in front of each home, where a marble turns in
export const HOME_ENTRY = [46, 22];
// landing exactly on a swirl jumps the marble across its bay's mouth to the twin
export const TELEPORTS = { 16: 28, 40: 4 };
