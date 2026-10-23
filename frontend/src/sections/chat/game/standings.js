const isLevel = (row, other) => row.won === other.won && row.drawn === other.drawn && row.played === other.played;

// rows come from the server most won first, then most drawn, then fewest played, so level players share a place
export const standingsOf = (rows, gameId) => {
  const ranked = rows.filter((row) => row.game === gameId);
  return ranked.map((row) => ({ ...row, place: 1 + ranked.findIndex((other) => isLevel(row, other)) }));
};

// the server deals two players opposite colours on the wheel, so a head to head shows a pair the game itself would give
export const rivalColoursOf = (marks) => [marks[0], marks[Math.floor(marks.length / 2)]];
