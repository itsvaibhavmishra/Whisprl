const RECENT_KEY = "whisprl-recent-emoji";
const SKIN_TONE_KEY = "whisprl-emoji-skin-tone";
const MAX_RECENT = 24;

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // with storage refused the picker still works, it only forgets between visits
  }
};

export const recentEmoji = () => {
  try {
    const saved = JSON.parse(read(RECENT_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export const rememberEmoji = (emoji) => {
  const recent = [emoji, ...recentEmoji().filter((kept) => kept !== emoji)].slice(0, MAX_RECENT);
  write(RECENT_KEY, JSON.stringify(recent));
  return recent;
};

export const savedSkinTone = () => read(SKIN_TONE_KEY) ?? "none";

export const saveSkinTone = (skinTone) => write(SKIN_TONE_KEY, skinTone);
