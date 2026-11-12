import single from "@/sections/chat/game/games/jackaroo/layout.json";
import teams from "@/sections/chat/game/games/jackaroo/layout-2v2.json";

// each table's holes as its own board art lays them out, in the same units, the board 1000 across
const LAYOUTS = { single, teams };
export const BOARD = single.board;

// each seat's place round the board, which marbles run clockwise; turns pass the other way, as the server's jackaroo/board.js seats them
const POSITIONS = { single: [0, 1], teams: [0, 3, 2, 1] };

// the board as one person sees it: their seat at the bottom, or the first seat for anyone watching
export const viewOf = (mode, seat) => {
  const positions = POSITIONS[mode];
  return { layout: LAYOUTS[mode], positions, at: positions[Math.max(seat, 0)] };
};

// the hole a seat's marbles come out onto
export const startOf = (owner, { layout, positions }) => layout.start[positions[owner]];

// for anyone not in the first seat each place shows where its owner's seat sits counted round from theirs, since the hand-drawn art is not exactly symmetric
export const pointOf = (place, owner, { layout, positions, at }) => {
  const { track, homes, bases } = layout;
  const seats = homes.length;
  if (place.at === "track") return track[(place.index - (at * track.length) / seats + track.length) % track.length];
  return (place.at === "home" ? homes : bases)[(positions[owner] - at + seats) % seats][place.slot];
};

// which corner of the board a seat's base sits in, counted round from the viewer's
export const shownSeatOf = (owner, { layout, positions, at }) => (positions[owner] - at + layout.homes.length) % layout.homes.length;

export const share = (units) => `${(units / BOARD) * 100}%`;

// placed by its centre, which a percentage margin can do because the board is square
export const centredAt = ({ x, y }, size) => ({
  position: "absolute",
  left: share(x),
  top: share(y),
  width: share(size),
  height: share(size),
  margin: `-${(size / BOARD) * 50}%`,
});

export const marbleKey = ({ owner, id }) => `${owner}.${id}`;

// both boards' holes are within a hair of the same size, so one set of sprite sizes serves them
export const SPRITES = single.sprites;
