export const DEFAULT_QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

export const quickReactionsOf = (user) => user.quickReactions?.length ? user.quickReactions : DEFAULT_QUICK_REACTIONS;

export const reactionsOf = (message, isForAlbum = false) => (isForAlbum ? message.albumReactions : message.reactions) ?? [];

export const myReactionOn = (message, userId, isForAlbum = false) => reactionsOf(message, isForAlbum).find((reaction) => reaction.user === userId)?.emoji;

const tallyReactions = (reactions = []) =>
  reactions.reduce((tally, { user, emoji }) => {
    const existing = tally.find((entry) => entry.emoji === emoji);
    if (existing) existing.users.push(user);
    else tally.push({ emoji, users: [user] });
    return tally;
  }, []);

export const rankedReactions = (reactions) => tallyReactions(reactions).sort((one, other) => other.users.length - one.users.length);
