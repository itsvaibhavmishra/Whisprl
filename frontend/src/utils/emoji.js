// one emoji can be a base, a skin tone, a variation selector and further emoji joined on, or a two-part flag
const SEQUENCE = /\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|⃣)*(?:‍\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|️|⃣)*)*|\p{Regional_Indicator}{2}/gu;

const emojiOnlyCount = (text) => {
  const condensed = text?.replace(/\s+/g, "") ?? "";
  if (!condensed) return 0;
  const found = condensed.match(SEQUENCE);
  return found?.join("") === condensed ? found.length : 0;
};

// a short burst of emoji stands bare, and the fewer there are the larger they read
const SIZES = [52, 44, 38, 34, 30];

export const bareEmojiSizeOf = (text) => SIZES[emojiOnlyCount(text) - 1];

const DEFAULT_QUICK_EMOJI = "😺";

export const quickEmojiOf = (conversation) => conversation?.quickEmoji || DEFAULT_QUICK_EMOJI;

export const MAX_EMOJI_SCALE = 3;

// the scale is written by whoever sent the message, so it is held to what holding the button can reach
export const emojiScaleOf = (scale) => Math.min(Math.max(scale ?? 1, 1), MAX_EMOJI_SCALE);
