import createHttpError from "http-errors";

// drawn for Whisprl and shipped with the app, so picking one uploads nothing
export const AVATAR_PRESETS = ["fox", "panda", "bunny", "penguin", "dragon", "owl", "snake", "koala"];

export const presetAvatarOf = (preset) => {
  if (!AVATAR_PRESETS.includes(preset)) throw createHttpError.BadRequest("Choose one of Whisprl's pictures");
  return `/avatars/${preset}.webp`;
};
