import layout from "@/sections/chat/game/games/jackaroo/layout.json";

// the board is drawn for the seat at the bottom and turned half way round for the other, which its symmetry allows
export const pointOf = (place, owner, isTurned) => {
  const { track, homes, bases, board } = layout;
  const point = place.at === "track" ? track[place.index] : place.at === "home" ? homes[owner][place.slot] : bases[owner][place.slot];
  return isTurned ? { x: board - point.x, y: board - point.y } : point;
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
