// drawn for Whisprl and shipped with the app, kept in step with the server's list
export const AVATAR_PRESETS = [
  { id: "fox", label: "Fox" },
  { id: "panda", label: "Panda" },
  { id: "bunny", label: "Bunny" },
  { id: "penguin", label: "Penguin" },
  { id: "dragon", label: "Dragon" },
  { id: "owl", label: "Owl" },
  { id: "snake", label: "Snake" },
  { id: "koala", label: "Koala" },
];

export const presetPathOf = (id) => `/avatars/${id}.webp`;

export const isPresetAvatar = (avatar) => Boolean(avatar?.startsWith("/avatars/"));
