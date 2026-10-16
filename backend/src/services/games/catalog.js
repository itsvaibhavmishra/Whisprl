import createHttpError from "http-errors";

import ticTacToe from "#src/services/games/ticTacToe.js";

const GAMES = new Map([ticTacToe].map((game) => [game.id, game]));

export const gameOf = (id) => {
  const game = GAMES.get(id);
  if (!game) throw createHttpError.BadRequest("That game does not exist");
  return game;
};
