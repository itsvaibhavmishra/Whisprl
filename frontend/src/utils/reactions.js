export const DEFAULT_QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

export const quickReactionsOf = (user) => user.quickReactions?.length ? user.quickReactions : DEFAULT_QUICK_REACTIONS;

export const myReactionOn = (message, userId) => message.reactions?.find((reaction) => reaction.user === userId)?.emoji;

export const tallyReactions = (reactions = []) =>
  reactions.reduce((tally, { user, emoji }) => {
    const existing = tally.find((entry) => entry.emoji === emoji);
    if (existing) existing.users.push(user);
    else tally.push({ emoji, users: [user] });
    return tally;
  }, []);
