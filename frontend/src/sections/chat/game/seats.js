// what a seat means, kept out of the components so the screens and their wording read it the same way

export const mayTake = (seat, meId) => !seat.user && (!seat.locked || seat.invited === meId);

// between two people the bot can take the seat saved for someone who has not answered, which takes the challenge back
export const mayHoldBot = (seat, isGroup) => !seat.user && !seat.bot && (!seat.locked || (!isGroup && Boolean(seat.invited)));

// a bot someone chose to play against sits alone, unlike a seat whose player left it to the bot
export const isChosenBot = (seat) => Boolean(seat.bot && !seat.user);

export const isTaken = (seat) => Boolean(seat.user || seat.bot);
