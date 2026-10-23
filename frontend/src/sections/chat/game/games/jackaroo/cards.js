const FACES = { 1: "A", 11: "J", 12: "Q", 13: "K" };
const SUITS = { S: "♠", H: "♥", D: "♦", C: "♣" };

export const isRed = ({ suit }) => suit === "H" || suit === "D";
export const rankOf = ({ rank }) => FACES[rank] ?? String(rank);
export const suitOf = ({ suit }) => SUITS[suit];

// what a card's face shows in its middle: a symbol of what it does, or its number for a plain move
export const faceOf = (card) => {
  const red = isRed(card);
  switch (card.rank) {
    case 1:
    case 2:
      return "out";
    case 4:
      return "back";
    case 5:
      return "anyone";
    case 7:
      return "split";
    case 10:
      return "discard";
    case 11:
      return red ? "number" : "swap";
    case 12:
      return red ? "take" : "number";
    case 13:
      return "sweep";
    default:
      return "number";
  }
};

// what the banner says when a card is picked, in the reference game's words with our marbles
export const bannerOf = (card) => {
  const red = isRed(card);
  switch (card.rank) {
    case 1:
      return "Move a marble 1 step or place a new one";
    case 2:
      return "Move a marble 2 steps or place a new one";
    case 4:
      return "Move your marble back 4 steps";
    case 5:
      return "Move any marble forward 5 steps";
    case 7:
      return "Move 1 or 2 marbles for a total of 7 steps";
    case 10:
      return "Move forward 10 steps or make the other player discard a card";
    case 11:
      return red ? "Move forward 11 steps" : "Swap your marble with one of theirs";
    case 12:
      return red ? "Discard a card from the other player's hand" : "Move forward 12 steps";
    case 13:
      return "Place a new marble or move 13 steps, knocking out every marble passed";
    default:
      return `Move forward ${card.rank} steps`;
  }
};
