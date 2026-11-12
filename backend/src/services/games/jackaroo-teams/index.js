import createHttpError from "http-errors";

import jackaroo from "#src/services/games/jackaroo/index.js";
import { setup } from "#src/services/games/jackaroo/rules.js";

const PAIRINGS = ["together", "against"];

// two against two: the same rules on a four-armed board, partners opposite, with its own records and leaderboard
const jackarooTeams = {
  ...jackaroo,
  id: "jackaroo-teams",
  name: "Jackaroo 2v2",
  minPlayers: 4,
  maxPlayers: 4,
  // between two people the other seats are bots, and the other person plays with you or against you
  options: {
    defaults: { pairing: "together" },
    assert: ({ pairing }) => {
      if (!PAIRINGS.includes(pairing)) throw createHttpError.BadRequest("Choose whether you play together or against each other");
    },
  },
  // where the other person sits between two: opposite you as your partner, or beside you as an opponent
  peerSeatOf: ({ pairing } = {}) => (pairing === "against" ? 1 : 2),
  setup: (previous, table) => setup(previous, { ...table, mode: "teams" }),
};

export default jackarooTeams;
