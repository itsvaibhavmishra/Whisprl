import { isChosenBot, isTaken } from "@/sections/chat/game/seats";
import { peerOf } from "@/utils/chats";
import { firstNameIn } from "@/utils/groups";

export const PRACTICE_NOTE = "Bot games don't count on the leaderboard";

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
  if (seat.bot) return "The bot's turn";
  if (seat.user === meId) return seat.away ? "The bot is playing for you" : "Your turn";
  const name = firstNameIn(conversation, seat.user, meId);
  return seat.away ? `The bot is playing for ${name}` : `${name}'s turn`;
};

export const resultLineOf = ({ winners }, conversation, meId) => {
  if (!winners.length) return "It's a draw";
  const [winner] = winners;
  return winner.bot ? "The bot won" : `${firstNameIn(conversation, winner.user, meId)} won`;
};
