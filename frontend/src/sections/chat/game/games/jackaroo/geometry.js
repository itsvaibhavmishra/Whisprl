import layout from "@/sections/chat/game/games/jackaroo/layout.json";

// the board is drawn for the seat at the bottom; turned for the other, each place shows on its partner across the board, since the hand-drawn art is not exactly symmetric
export const pointOf = (place, owner, isTurned) => {
  const { track, homes, bases } = layout;
  const seat = isTurned ? 1 - owner : owner;
  if (place.at === "track") return track[isTurned ? (place.index + track.length / 2) % track.length : place.index];
  return (place.at === "home" ? homes : bases)[seat][place.slot];
};

export const share = (units) => `${(units / layout.board) * 100}%`;

// placed by its centre, which a percentage margin can do because the board is square
export const centredAt = ({ x, y }, size) => ({
  position: "absolute",
  left: share(x),
  top: share(y),
  width: share(size),
  height: share(size),
  margin: `-${(size / layout.board) * 50}%`,
});

export const marbleKey = ({ owner, id }) => `${owner}.${id}`;

export const SPRITES = layout.sprites;
