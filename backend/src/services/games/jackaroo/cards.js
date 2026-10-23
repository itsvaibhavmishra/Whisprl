const SUITS = ["S", "H", "D", "C"];

export const isRed = ({ suit }) => suit === "H" || suit === "D";

// every card carries its deck's number, so two of the same card from different decks stay apart
export const newDeck = (deck) => SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({ id: `${deck}-${index + 1}${suit}`, rank: index + 1, suit })));

export const shuffled = (cards) => {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};
