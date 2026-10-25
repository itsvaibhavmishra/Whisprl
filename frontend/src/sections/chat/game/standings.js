const isLevel = (row, other) => row.won === other.won && row.drawn === other.drawn && row.played === other.played;

// the server ranks by wins, then draws, then fewest games, so level players share a place, and as it orders them by chance you lead them
export const standingsOf = (rows, gameId, meId) => {
  const ranked = rows.filter((row) => row.game === gameId);
  return ranked
    .map((row) => ({ ...row, place: 1 + ranked.findIndex((other) => isLevel(row, other)) }))
    .sort((one, other) => one.place - other.place || Number(other.user === meId) - Number(one.user === meId));
};

// the server deals two players opposite colours on the wheel, so a head to head shows a pair the game itself would give
export const rivalColoursOf = (marks) => [marks[0], marks[Math.floor(marks.length / 2)]];
