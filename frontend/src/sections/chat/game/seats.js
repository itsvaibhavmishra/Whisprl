// what a seat means, kept out of the components so the screens and their wording read it the same way

export const mayTake = (seat, meId) => !seat.user && (!seat.locked || seat.invited === meId);

export const mayHoldBot = (seat) => !seat.user && !seat.bot && !seat.locked;

// a bot someone chose to play against sits alone, unlike a seat whose player left it to the bot
export const isChosenBot = (seat) => Boolean(seat.bot && !seat.user);

export const isTaken = (seat) => Boolean(seat.user || seat.bot);
