import createHttpError from "http-errors";

import dotsAndBoxes from "#src/services/games/dots-and-boxes/index.js";
import ticTacToe from "#src/services/games/tic-tac-toe/index.js";

const GAMES = new Map([ticTacToe, dotsAndBoxes].map((game) => [game.id, game]));

export const gameOf = (id) => {
  const game = GAMES.get(id);
  if (!game) throw createHttpError.BadRequest("That game does not exist");
  return game;
};
