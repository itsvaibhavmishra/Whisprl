export const QUICK_REACTION_COUNT = 6;

// an emoji can be several code points joined together, but never letters or spaces
export const isEmoji = (value) =>
  typeof value === "string" && value.length <= 16 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(value) && !/[\p{L}\s]/u.test(value);

export const areQuickReactions = (reactions) =>
  Array.isArray(reactions) && reactions.length === QUICK_REACTION_COUNT && reactions.every(isEmoji) && new Set(reactions).size === reactions.length;
