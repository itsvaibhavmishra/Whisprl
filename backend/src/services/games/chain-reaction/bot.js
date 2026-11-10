import { criticalMassOf, isOut, legalCellsFor, neighboursOf, outcome, play, turnOf } from "#src/services/games/chain-reaction/rules.js";

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

// how often each level plays without looking, tuned by simulating games against it
export const DISTRACTED = { dumb: 0.8, medium: 0.2, pro: 0.03, standIn: 0.45 };

const WIN = 10000;
// the few most promising moves are read a reply deeper, within this long, so a big board never holds the server up
const LOOKED_AT = 10;
const THINKING_MS = 120;

const isAboutToBurst = (state, cell) => state.orbs[cell] === criticalMassOf(state, cell) - 1;

// what a seat holds, worth more on corners and edges and when ready to burst, and worth little beside an enemy about to burst into it
const worthTo = (state, seat) => {
  const finished = outcome(state);
  if (finished) return finished.winners[0] === seat ? WIN : -WIN;
  return state.owners.reduce((worth, owner, cell) => {
    if (owner !== seat) return worth;
    const mass = criticalMassOf(state, cell);
    const isThreatened = neighboursOf(state, cell).some(
      (neighbour) => state.owners[neighbour] !== null && state.owners[neighbour] !== seat && isAboutToBurst(state, neighbour)
    );
    if (isThreatened) return worth - (5 - mass);
    return worth + state.orbs[cell] + (4 - mass) + (isAboutToBurst(state, cell) ? 2 : 0);
  }, 0);
};

// reads each promising move against the reply that hurts it most, so it sees the cascade one move out that an ordinary player walks into
const expertMove = (state, seat) => {
  const startedAt = Date.now();
  const moves = legalCellsFor(state, seat)
    .map((cell) => ({ cell, after: play(state, seat, cell) }))
    .map((move) => ({ ...move, worth: worthTo(move.after, seat) }))
    .sort((one, other) => other.worth - one.worth);
  if (moves[0].worth === WIN) return moves[0].cell;
  const read = moves.slice(0, LOOKED_AT).map((move) => {
    if (Date.now() - startedAt > THINKING_MS) return move;
    const replier = turnOf(move.after);
    const strongest = legalCellsFor(move.after, replier)
      .map((cell) => play(move.after, replier, cell))
      .map((reply) => ({ reply, worth: worthTo(reply, replier) }))
      .reduce((best, option) => (option.worth > best.worth ? option : best));
    return { ...move, worth: worthTo(strongest.reply, seat) };
  });
  const best = Math.max(...read.map(({ worth }) => worth));
  return anyOf(read.filter(({ worth }) => worth === best)).cell;
};

// an ordinary player reads one move ahead and no further, so anyone who sets up a cascade two moves out can beat it
export const botMove = (state, seat, level = "medium") => {
  if (level === "expert") return expertMove(state, seat);
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

const CAPTURES_WORTH_A_REACTION = 3;

export const BOT_MOODS = { captured: "proud", knockedOut: "proud", lost: "hurt" };

export const momentFor = (before, after, seat) => {
  const mover = turnOf(before);
  if (mover === seat) {
    if (knocksOut(before, seat, after)) return "knockedOut";
    return capturedBy(before, seat, after) >= CAPTURES_WORTH_A_REACTION ? "captured" : null;
  }
  const lost = before.owners.filter((owner, cell) => owner === seat && after.owners[cell] !== seat).length;
  return lost >= CAPTURES_WORTH_A_REACTION ? "lost" : null;
};
