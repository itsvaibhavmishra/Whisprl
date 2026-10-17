import createHttpError from "http-errors";

// pure functions over plain lists, so the seating rules are tested without a database

const MISSES_BEFORE_AWAY = 2;

const same = (one, other) => Boolean(one) && String(one) === String(other);

const vacated = ({ locked }) => ({ ready: false, locked: Boolean(locked) });

const withoutInvite = ({ invited: _, ...seat }) => seat;

const replaceAt = (seats, index, seat) => seats.map((current, at) => (at === index ? seat : current));

const seatAt = (seats, index) => {
  if (!Number.isInteger(index) || index < 0 || index >= seats.length) throw createHttpError.BadRequest("That seat does not exist");
  return seats[index];
};

export const emptySeats = (count) => Array.from({ length: count }, () => vacated({}));

// a bot someone chose to play has a seat of its own, unlike one covering for a person who left
export const isChosenBot = (seat) => Boolean(seat.bot && !seat.user);

// a bot only keeps someone company, so it leaves once the last person has
const withoutLoneBots = (seats) => (seats.some((seat) => seat.user) ? seats : seats.map((seat) => (isChosenBot(seat) ? vacated(seat) : seat)));

export const seatIndexOf = (seats, userId) => seats.findIndex((seat) => same(seat.user, userId));

// a seat its player left to the bot is still theirs, but they no longer play it
export const playerIndexOf = (seats, userId) => seats.findIndex((seat) => same(seat.user, userId) && !seat.bot);

export const invitedIndexOf = (seats, userId) => seats.findIndex((seat) => same(seat.invited, userId));

export const sit = (seats, index, userId) => {
  const seat = seatAt(seats, index);
  if (seatIndexOf(seats, userId) !== -1) throw createHttpError.BadRequest("You already have a seat");
  if (seat.user) throw createHttpError.BadRequest("Someone is already sitting there");
  if (seat.locked && !same(seat.invited, userId)) throw createHttpError.BadRequest("That seat is locked");
  // a person always takes the seat over from a bot
  return replaceAt(seats, index, { locked: Boolean(seat.locked), user: userId, ready: false });
};

export const seatBot = (seats, index) => {
  const seat = seatAt(seats, index);
  if (seat.user || seat.bot) throw createHttpError.BadRequest("Someone is already sitting there");
  if (seat.locked) throw createHttpError.BadRequest("That seat is locked");
  return replaceAt(seats, index, { locked: false, bot: true, ready: true });
};

export const unseatBot = (seats, index) => {
  const seat = seatAt(seats, index);
  if (!isChosenBot(seat)) throw createHttpError.BadRequest("No bot is sitting there");
  return replaceAt(seats, index, vacated(seat));
};

export const stand = (seats, userId) => {
  const index = seatIndexOf(seats, userId);
  if (index === -1) throw createHttpError.BadRequest("You are not sitting");
  return withoutLoneBots(replaceAt(seats, index, vacated(seats[index])));
};

export const lift = (seats, index) => {
  const seat = seatAt(seats, index);
  if (!seat.user) throw createHttpError.BadRequest("Nobody is sitting there");
  return { seats: withoutLoneBots(replaceAt(seats, index, vacated(seat))), lifted: seat.user };
};

export const setReady = (seats, userId, ready) => {
  const index = seatIndexOf(seats, userId);
  if (index === -1) throw createHttpError.BadRequest("Take a seat first");
  return replaceAt(seats, index, { ...seats[index], ready: Boolean(ready) });
};

// a chosen bot is always ready, so it never holds a game up
export const unreadyAll = (seats) => seats.map((seat) => ({ ...seat, ready: isChosenBot(seat) }));

export const setLocked = (seats, index, locked) => {
  const seat = seatAt(seats, index);
  return replaceAt(seats, index, locked ? { ...seat, locked: true } : { ...withoutInvite(seat), locked: false });
};

// an invitation holds the seat for one person, and stays until someone unlocks it
export const invite = (seats, index, userId) => {
  const seat = seatAt(seats, index);
  if (seat.user) throw createHttpError.BadRequest("Someone is already sitting there");
  if (seatIndexOf(seats, userId) !== -1) throw createHttpError.BadRequest("They already have a seat");
  return replaceAt(seats, index, { ...seat, locked: true, invited: userId });
};

export const declineInvite = (seats, userId) => seats.map((seat) => (same(seat.invited, userId) ? withoutInvite(seat) : seat));

export const handToBot = (seats, userId) => {
  const index = seatIndexOf(seats, userId);
  if (index === -1) throw createHttpError.BadRequest("You are not playing");
  return replaceAt(seats, index, { ...seats[index], bot: true, ready: false });
};

export const isBotPlaying = (seat) => Boolean(seat.bot || seat.away);

// a second missed turn in a row hands the seat to the bot until its player comes back
export const missTurn = (seats, index) => {
  const seat = seats[index];
  if (isBotPlaying(seat)) return seats;
  const missed = (seat.missed ?? 0) + 1;
  return replaceAt(seats, index, { ...seat, missed, away: missed >= MISSES_BEFORE_AWAY });
};

export const playedTurn = (seats, index) => replaceAt(seats, index, { ...seats[index], missed: 0 });

export const comeBack = (seats, userId) => {
  const index = seatIndexOf(seats, userId);
  if (index === -1 || seats[index].bot) throw createHttpError.BadRequest("You are not playing");
  return replaceAt(seats, index, { ...seats[index], away: false, missed: 0 });
};

export const isEveryoneReady = (seats, minPlayers) => {
  const seated = seats.filter((seat) => seat.user || seat.bot);
  return seated.length >= minPlayers && seated.some((seat) => seat.user) && seated.every((seat) => seat.ready);
};

// back in the lobby after a game, whoever left it gives their seat up and nobody is ready yet
export const backToLobby = (seats) =>
  withoutLoneBots(
    seats.map((seat) => {
      if (isChosenBot(seat)) return seat;
      if (seat.bot) return vacated(seat);
      return seat.user ? { user: seat.user, locked: Boolean(seat.locked), ready: false } : seat;
    })
  );

const isTaken = (seat) => Boolean(seat.user || seat.bot);

// the same game with more or fewer seats: new ones go on the end, and empty ones come off it
export const withSeatCount = (seats, count) => {
  if (seats.filter(isTaken).length > count) throw createHttpError.BadRequest("More players are seated than that");
  let surplus = seats.length - count;
  const kept = [...seats]
    .reverse()
    .filter((seat) => {
      if (isTaken(seat) || surplus <= 0) return true;
      surplus -= 1;
      return false;
    })
    .reverse();
  return [...kept, ...emptySeats(count - kept.length)];
};

// a different game keeps everyone seated that it has room for
export const resized = (seats, count) => {
  const kept = seats.filter((seat) => seat.user).slice(0, count);
  return [...kept.map(({ user }) => ({ user, ready: false, locked: false })), ...emptySeats(count - kept.length)];
};
