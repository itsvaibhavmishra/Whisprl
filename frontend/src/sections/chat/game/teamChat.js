// the partner you can whisper to at a team game in a group: someone playing their own seat on your team, never a bot or a stand-in
export const teamPartnerOf = (session, conversation, meId) => {
  const team = session?.state?.team;
  if (!conversation?.isGroup || session?.status !== "playing" || !team) return null;
  const index = session.seats.findIndex((seat) => seat.user === meId && !seat.bot);
  if (index === -1) return null;
  const partner = session.seats.find((seat, other) => other !== index && team[other] === team[index]);
  return partner?.user && !partner.bot && !partner.away && !partner.official ? partner : null;
};
