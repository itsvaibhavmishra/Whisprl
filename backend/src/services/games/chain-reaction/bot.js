import { criticalMassOf, isOut, legalCellsFor, neighboursOf, outcome, play } from "#src/services/games/chain-reaction/rules.js";

const anyOf = (moves) => moves[Math.floor(Math.random() * moves.length)];

// a cell is a gift when an enemy beside it is one orb from bursting into it, unless this move bursts first
const isExposed = (state, seat, cell) => {
  if (state.orbs[cell] + 1 >= criticalMassOf(state, cell)) return false;
  return neighboursOf(state, cell).some(
    (neighbour) => state.owners[neighbour] !== null && state.owners[neighbour] !== seat && state.orbs[neighbour] === criticalMassOf(state, neighbour) - 1
  );
};

const capturedBy = (state, seat, after) => state.owners.filter((owner, cell) => owner !== null && owner !== seat && after.owners[cell] === seat).length;

const knocksOut = (state, seat, after) => state.played.some((_, other) => other !== seat && !isOut(state, other) && isOut(after, other));

// a lower critical mass holds ground more cheaply, so corners come before edges and edges before the middle
const byFewestNeighbours = (state, moves) => {
  const fewest = Math.min(...moves.map(({ cell }) => criticalMassOf(state, cell)));
  return moves.filter(({ cell }) => criticalMassOf(state, cell) === fewest);
};

// how often it plays without looking, tuned by simulating games against it
export const DISTRACTED = { opponent: 0.2, standIn: 0.45 };

// an ordinary player: it reads one move ahead and no further, so anyone who sets up a cascade two moves out can beat it
export const botMove = (state, seat, level = "opponent") => {
  const moves = legalCellsFor(state, seat).map((cell) => ({ cell, after: play(state, seat, cell) }));
  // a win or a knockout is always taken, because walking past one looks broken rather than kind
  const decisive = moves.filter(({ after }) => outcome(after)?.winners[0] === seat || knocksOut(state, seat, after));
  if (decisive.length) return anyOf(decisive).cell;
  if (Math.random() < DISTRACTED[level]) return anyOf(moves).cell;

  const safe = moves.filter(({ cell }) => !isExposed(state, seat, cell));
  if (!safe.length) return anyOf(moves).cell;
  const captures = safe.map((move) => ({ ...move, taken: capturedBy(state, seat, move.after) }));
  const most = Math.max(...captures.map(({ taken }) => taken));
  if (most > 0) return anyOf(captures.filter(({ taken }) => taken === most)).cell;
  return anyOf(byFewestNeighbours(state, safe)).cell;
};
