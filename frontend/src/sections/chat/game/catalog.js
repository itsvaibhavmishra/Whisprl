import dotsAndBoxes from "@/sections/chat/game/games/dots-and-boxes";
import ticTacToe from "@/sections/chat/game/games/tic-tac-toe";

const GAME_LIST = [ticTacToe, dotsAndBoxes];

export const GAMES = Object.fromEntries(GAME_LIST.map((game) => [game.id, game]));

export const GAME_IDS = GAME_LIST.map((game) => game.id);
