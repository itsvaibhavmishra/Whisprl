import { personaOf } from "@/sections/chat/game/bots";
import { isChosenBot, isTaken } from "@/sections/chat/game/seats";
import { peerOf } from "@/utils/chats";
import { firstNameIn } from "@/utils/groups";

export const PRACTICE_NOTE = "Bot games don't count on the leaderboard";

// the table shown while the server sets it up, so a game opens the moment it is chosen
export const openingSessionOf = (game) => ({ game, status: "opening", seats: [], players: { min: 0, max: 0 } });

const twoPlayerLineOf = (session, conversation, meId) => {
  const peer = peerOf(conversation, meId);
  const mine = session.seats.find((seat) => seat.user === meId);
  const theirs = session.seats.find((seat) => seat.user === peer._id);
  const hasBot = session.seats.some(isChosenBot);
  if (!mine && hasBot) return `${peer.firstName} is playing the bot. Take its seat to play instead.`;
  if (!mine) return theirs ? `${peer.firstName} wants to play. Take the other seat.` : "Take a seat to play";
  if (hasBot) return "Press Ready to play the bot";
  if (!theirs) return `Waiting for ${peer.firstName} to sit down`;
  if (mine.ready) return `Waiting for ${peer.firstName} to be ready`;
  return theirs.ready ? `${peer.firstName} is ready. Are you?` : "Press Ready when you are";
};

export const lobbyLineOf = (session, conversation, meId) => {
  if (!conversation.isGroup) return twoPlayerLineOf(session, conversation, meId);
  const seated = session.seats.filter(isTaken);
  if (seated.length < session.seats.length) return "Waiting for players";
  return "Waiting for everyone to be ready";
};

export const turnLineOf = (session, conversation, meId) => {
  const seat = session.seats[session.turn];
  if (seat.bot) return `${personaOf(seat)?.name ?? "The bot"}'s turn`;
  if (seat.user === meId) return seat.away ? "The bot is playing for you" : "Your turn";
  const name = firstNameIn(conversation, seat.user, meId);
  return seat.away ? `The bot is playing for ${name}` : `${name}'s turn`;
};

export const resultLineOf = ({ winners, leftBy }, conversation, meId) => {
  if (leftBy === meId) return "You left, so it counts as a loss";
  if (leftBy) return `${firstNameIn(conversation, leftBy, meId)} left, so you win`;
  if (!winners.length) return "It's a draw";
  const [winner] = winners;
  if (winner.bot) return `${personaOf(winner)?.name ?? "The bot"} won`;
  return `${firstNameIn(conversation, winner.user, meId)} won`;
};
