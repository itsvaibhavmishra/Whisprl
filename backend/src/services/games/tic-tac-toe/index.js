import { BOT_REACTIONS, botMove, momentFor } from "#src/services/games/tic-tac-toe/bot.js";
import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/tic-tac-toe/rules.js";

const ticTacToe = {
  id: "tic-tac-toe",
  name: "Tic-tac-toe",
  minPlayers: 2,
  maxPlayers: 2,
  turnSeconds: 30,
  setup,
  turnOf,
  play,
  outcome,
  botMove,
  momentFor,
  reactions: BOT_REACTIONS,
  viewFor,
};

export default ticTacToe;
