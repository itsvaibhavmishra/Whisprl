import { botMove } from "#src/services/games/jackaroo/bot.js";
import { playOutMs, thinkMs } from "#src/services/games/jackaroo/pace.js";
import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/jackaroo/rules.js";

// one against one for now; two against two adds partners and a mode for groups
const jackaroo = {
  id: "jackaroo",
  name: "Jackaroo",
  minPlayers: 2,
  maxPlayers: 2,
  turnSeconds: 15,
  setup,
  turnOf,
  play,
  outcome,
  botMove,
  viewFor,
  playOutMs,
  thinkMs,
};

export default jackaroo;
