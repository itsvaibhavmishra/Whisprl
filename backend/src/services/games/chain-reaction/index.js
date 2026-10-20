import { botMove } from "#src/services/games/chain-reaction/bot.js";
import { assertOptions, DEFAULTS, outcome, play, setup, turnOf, viewFor } from "#src/services/games/chain-reaction/rules.js";

const chainReaction = {
  id: "chain-reaction",
  name: "Chain Reaction",
  minPlayers: 2,
  maxPlayers: 6,
  turnSeconds: 20,
  options: { defaults: DEFAULTS, assert: assertOptions },
  setup,
  turnOf,
  play,
  outcome,
  botMove,
  viewFor,
};

export default chainReaction;
