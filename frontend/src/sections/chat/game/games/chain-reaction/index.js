import { lazy } from "react";

import art from "@/sections/chat/game/games/chain-reaction/art";
import { totalOf } from "@/sections/chat/game/games/chain-reaction/cascade";
import masthead from "@/sections/chat/game/games/chain-reaction/masthead.json";
import PALETTE, { colourOf } from "@/sections/chat/game/games/chain-reaction/palette";
import { mostPlayersOn } from "@/sections/chat/game/games/chain-reaction/sizes";
import SizePreview from "@/sections/chat/game/games/chain-reaction/SizePreview";

const chainReaction = {
  id: "chain-reaction",
  name: "Chain Reaction",
  summary: "Fill a cell until it bursts and takes its neighbours. For two to six players.",
  keywords: ["atoms", "orbs", "explosion", "critical mass", "burst"],
  art,
  preload: [art.scene, art.logo, art.cat, art.robot],
  theme: {
    surface: "#1C1748",
    card: "rgba(26, 22, 64, 0.9)",
    ink: "#EFEBFF",
    accent: "#9B5CFF",
    // a deep night blue, so the start screen's wash darkens the sky rather than greying it
    shade: "10, 8, 34",
    marks: PALETTE,
  },
  // one piece, so the whole logo drops in together wherever the canvas draws a title
  title: { ratio: masthead.logo.width / masthead.logo.height, words: [{ word: "chain-reaction", src: art.logo, left: 0, top: 0, width: 1, height: 1 }] },
  width: { min: 380, preferred: 560, max: 820 },
  options: [
    {
      key: "size",
      label: "Board size",
      choices: [
        { value: "quick", label: "5 × 7", note: "Quick" },
        { value: "standard", label: "6 × 9", note: "Standard" },
        { value: "long", label: "7 × 11", note: "Long" },
      ],
      Preview: SizePreview,
      unavailable: (size, players) => {
        const most = mostPlayersOn(size);
        return players > most ? `Up to ${most} players` : null;
      },
    },
  ],
  rules: [
    { heading: "The aim", text: "Be the last player with orbs on the board." },
    { heading: "Your turn", text: "Add one orb to an empty cell or to one of your own. You can never add to someone else's." },
    { heading: "Bursting", text: "A cell bursts when it holds as many orbs as it has neighbours: two in a corner, three on an edge, four in the middle." },
    { heading: "Chain reactions", text: "A burst sends one orb into each neighbouring cell and turns those cells your colour, which can make them burst too." },
    { heading: "The end", text: "Lose all your orbs after your first turn and you're out. The last player left wins, and there are no draws." },
  ],
  // Lodestar by Centurion_of_war, CC0, from opengameart.org
  music: art.music,
  moveSound: "orb",
  // a burst moves orbs without making or losing any, so the count on the board is the count of moves
  moveCountOf: (state) => (state ? totalOf(state) : 0),
  colourOf,
  isOut: (state, seat) => Boolean(state?.out?.[seat]),
  // lazy, like the board, so anything that only reads the catalog never loads their animation code
  Masthead: lazy(() => import("@/sections/chat/game/games/chain-reaction/Masthead")),
  mastheadRatio: masthead.stage.width / masthead.stage.height,
  Wordmark: lazy(() => import("@/sections/chat/game/games/chain-reaction/Wordmark")),
  Board: lazy(() => import("@/sections/chat/game/games/chain-reaction/Board")),
};

export default chainReaction;
