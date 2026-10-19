const EXACT = 1;
const PREFIX = 0.8;
const TYPO = 0.6;
const INSIDE = 0.5;

// letters and digits of any script, accents folded, so "Café", "cafe" and "CAFE!" are one word
export const normalized = (text = "") =>
  String(text)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export const wordsOf = (text) => normalized(text).split(" ").filter(Boolean);

// "Tic-Tac-Toe", "tic tac toe" and "The TicTacToe" are one game
export const nameKeyOf = (name) => normalized(name).replace(/^the /, "").replaceAll(" ", "");

const typosAllowed = (word) => {
  if (word.length >= 8) return 2;
  if (word.length >= 4) return 1;
  return 0;
};

// optimal string alignment distance, which counts a swapped pair of letters as one typo, given up once past the limit
export const isWithinEdits = (left, right, limit) => {
  if (Math.abs(left.length - right.length) > limit) return false;
  let beforePrevious = [];
  let previous = Array.from({ length: right.length + 1 }, (_, position) => position);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      let distance = Math.min(previous[column] + 1, current[column - 1] + 1, previous[column - 1] + cost);
      const isSwap = row > 1 && column > 1 && left[row - 1] === right[column - 2] && left[row - 2] === right[column - 1];
      if (isSwap) distance = Math.min(distance, beforePrevious[column - 2] + 1);
      current.push(distance);
    }
    if (Math.min(...current) > limit) return false;
    beforePrevious = previous;
    previous = current;
  }
  return previous[right.length] <= limit;
};

const wordMatch = (queryWord, { words, joined }) => {
  let best = 0;
  const allowed = typosAllowed(queryWord);
  for (const word of words) {
    if (word === queryWord) return EXACT;
    if (word.startsWith(queryWord)) best = Math.max(best, PREFIX);
    else if (allowed && isWithinEdits(queryWord, word, allowed)) best = Math.max(best, TYPO);
  }
  if (!best && queryWord.length >= 3 && joined.includes(queryWord)) best = INSIDE;
  return best;
};

// every word asked for has to match in some field, and each match counts for its field's weight
export const searchScore = (query, fields) => {
  const queryWords = wordsOf(query);
  if (!queryWords.length) return 0;
  const prepared = fields.map(({ text, weight }) => {
    const words = wordsOf(text);
    return { words, joined: words.join(""), weight };
  });
  let total = 0;
  for (const queryWord of queryWords) {
    const best = Math.max(...prepared.map((field) => field.weight * wordMatch(queryWord, field)));
    if (!best) return 0;
    total += best;
  }
  return total;
};
