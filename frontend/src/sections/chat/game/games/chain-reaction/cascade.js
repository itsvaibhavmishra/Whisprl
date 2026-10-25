export const neighboursOf = ({ width, height }, cell) => {
  const row = Math.floor(cell / width);
  const col = cell % width;
  const around = [];
  if (row > 0) around.push(cell - width);
  if (row < height - 1) around.push(cell + width);
  if (col > 0) around.push(cell - 1);
  if (col < width - 1) around.push(cell + 1);
  return around;
};

export const totalOf = ({ orbs }) => orbs.reduce((sum, count) => sum + count, 0);

const placedOn = ({ owners, orbs }, cell, seat) => ({
  owners: owners.map((owner, at) => (at === cell ? seat : owner)),
  orbs: orbs.map((count, at) => (at === cell ? count + 1 : count)),
});

// the bursting cells as the round begins, their orbs already in the air
export const emptied = (grid, { owners, orbs }, burst) => {
  const nextOwners = [...owners];
  const nextOrbs = [...orbs];
  burst.forEach((cell) => {
    nextOrbs[cell] -= neighboursOf(grid, cell).length;
    if (!nextOrbs[cell]) nextOwners[cell] = null;
  });
  return { owners: nextOwners, orbs: nextOrbs };
};

const landed = (grid, board, burst, seat) => {
  const { owners, orbs } = emptied(grid, board, burst);
  burst.forEach((cell) =>
    neighboursOf(grid, cell).forEach((neighbour) => {
      orbs[neighbour] += 1;
      owners[neighbour] = seat;
    })
  );
  return { owners, orbs };
};

const isSameBoard = (one, other) =>
  one.orbs.every((count, cell) => count === other.orbs[cell]) && one.owners.every((owner, cell) => owner === other.owners[cell]);

// the server decides what burst and where it stopped; this only replays the rounds it sent, and gives up rather than show something else
export const framesOf = (before, after) => {
  if (!before || !after?.lastMove || before.orbs.length !== after.orbs.length || totalOf(after) !== totalOf(before) + 1) return null;
  const { seat, cell } = after.lastMove;
  const frames = after.bursts.reduce((list, burst) => [...list, landed(after, list[list.length - 1], burst, seat)], [placedOn(before, cell, seat)]);
  return isSameBoard(frames[frames.length - 1], after) ? frames : null;
};
