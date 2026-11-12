import { lazy } from "react";

import jackaroo from "@/sections/chat/game/games/jackaroo";
import art from "@/sections/chat/game/games/jackaroo/art";
import masthead from "@/sections/chat/game/games/jackaroo/masthead.json";

// the same game two against two, on a four-armed board with its own leaderboard; the board, cards, sounds and music are Jackaroo's
const jackarooTeams = {
  ...jackaroo,
  id: "jackaroo-teams",
  name: "Jackaroo 2v2",
  // chosen from Jackaroo's own lobby rather than the list of games
  modeOf: "jackaroo",
  preload: [art.scene, art.title, art.teams.startBoard, ...masthead.marbles.map(({ tone }) => art.marble(tone))],
  versus: false,
  // each seat's team, partners opposite, as the server deals them
  teams: [0, 1, 0, 1],
  // between two people the other seats are bots, and the other person plays with you or against you
  options: [
    {
      key: "pairing",
      label: "Your friend plays",
      isBetweenTwoOnly: true,
      choices: [
        { value: "together", label: "Friend with you", note: "Against two bots" },
        { value: "against", label: "Friend against you", note: "Each with a bot" },
      ],
    },
  ],
  // where the other person sits between two, as the server seats them
  peerSeatOf: (options) => (options?.pairing === "against" ? 1 : 2),
  rules: [
    {
      heading: "The aim",
      text: "Play with the partner sitting opposite you. Your team wins once all eight of your marbles, four each, are home.",
      picture: "team-aim",
    },
    {
      heading: "Teams",
      text: "Seats 1 and 3 are team A, seats 2 and 4 team B, marked A and B on every player. In a group, pick your team by the seat you take; in a chat for two, choose whether your friend plays with you or against you. Your partner's arm is across the board from yours. Turns pass to the right, round the table the opposite way to the marbles, so the teams take turns.",
      picture: "team-teams",
    },
    {
      heading: "Your turn",
      text: "A deck is dealt over three rounds: four cards each, four more, then five. On your turn, play a card. If none can move, throw one away, or your whole hand once nothing can change this round. You see only your own cards, not your partner's.",
      picture: "team-turn",
    },
    {
      heading: "Bringing a marble out",
      text: "All four of your marbles start in your base. An ace or a king brings one out onto your start, the ringed hole at the corner of your arm.",
      picture: "team-out",
    },
    {
      heading: "Moving",
      text: "A card moves a marble that many holes forward. Your marble can pass anyone else's, but never your own. Nobody can pass or land on a marble sitting on its own start, your partner's included.",
      picture: "team-moving",
    },
    {
      heading: "Knocking out",
      text: "Land on a marble and it goes back to its base, even your partner's or your own.",
      picture: "team-knockout",
    },
    {
      heading: "Special cards",
      text: "An ace moves 1 or 11. A 4 moves back. A 5 moves any marble, an opponent's too, though theirs never into their home. A 7 can be split between two of your marbles. A 10 moves 10, or makes the next player throw away a card of their choice and miss their turn. A jack swaps one of your marbles with anyone else's. A queen moves 12. A king only brings a marble out.",
      picture: "team-special",
    },
    {
      heading: "Home",
      text: "Your home is the lane of four ringed holes in the middle of your arm. A marble goes in on an exact count and never runs past it. While another player's marble sits in the hole in front of your home, it is shut until that marble moves.",
      picture: "team-home",
    },
    {
      heading: "Helping your partner",
      text: "Once all four of your marbles are home, your cards move your partner's marbles, and an ace or a king brings theirs out. A 7 that takes your last marble home can finish on your partner's marble.",
      picture: "team-partner",
    },
  ],
  Masthead: lazy(() => import("@/sections/chat/game/games/jackaroo/Masthead").then(({ TeamsMasthead }) => ({ default: TeamsMasthead }))),
};

export default jackarooTeams;
