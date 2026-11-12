import { BOT_MOODS, botMove, momentFor } from "#src/services/games/jackaroo/bot.js";
import { tableOf } from "#src/services/games/jackaroo/board.js";
import { eventMs, playOutMs, thinkMs } from "#src/services/games/jackaroo/pace.js";
import { isMidTurn, outcome, play, setup, turnOf, viewFor } from "#src/services/games/jackaroo/rules.js";

// one against one; jackaroo-teams plays the same rules two against two
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
  momentFor,
  moods: BOT_MOODS,
  viewFor,
  playOutMs,
  eventMs,
  thinkMs,
  isMidTurn,
  earnedCard: (state) => Boolean(state.lastPlay?.bonus),
  // which team each seat plays for, so the table knows who may whisper to whom
  teamOf: (state) => tableOf(state).team,
  // one table switches between these in its lobby, each keeping its own records
  modes: ["jackaroo", "jackaroo-teams"],
};

export default jackaroo;
