import { botMove } from "#src/services/games/dots-and-boxes/bot.js";
import { assertOptions, DEFAULTS, outcome, play, setup, turnOf, viewFor } from "#src/services/games/dots-and-boxes/rules.js";

const dotsAndBoxes = {
  id: "dots-and-boxes",
  minPlayers: 2,
  maxPlayers: 6,
  turnSeconds: 20,
  // a game with settings says so here; one without, such as tic-tac-toe, leaves this out
  options: { defaults: DEFAULTS, assert: assertOptions },
  setup,
  turnOf,
  play,
  outcome,
  botMove,
  viewFor,
};

export default dotsAndBoxes;
