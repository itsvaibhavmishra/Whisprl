import { Avatar } from "@mui/material";

import { gradientOf } from "@/utils/gradients";

// deep enough to keep white initials readable
const AVATAR_GRADIENTS = [
  ["#0979C2", "#3E5BDB"],
  ["#7444E0", "#B23AAE"],
  ["#0B7F75", "#1F8FA8"],
  ["#C2560F", "#D23A4E"],
  ["#C8264B", "#8A2BC0"],
  ["#2453D6", "#3E86E8"],
  ["#3F7D20", "#16876A"],
  ["#5B4BC4", "#2F6FD6"],
];

// lighter twins of the gradients' first colours, for names written on a dark background
const NIGHT_NAME_COLORS = ["#5CC8F2", "#B794FF", "#3EE6CF", "#FFB46B", "#FF8FA8", "#7AA2FF", "#9BD35A", "#A9A1F5"];

// seeded by the first word, so "Bianca" in a group and "Bianca Rossi" in the list get the same colours
const seedOf = (name) => [...(name ?? "").split(" ")[0]].reduce((sum, character) => sum + character.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;

export const avatarLookOf = (name) => ({ initial: (name ?? "").charAt(0).toUpperCase(), background: gradientOf(AVATAR_GRADIENTS[seedOf(name)]) });

export const nameColorOf = (name, mode) => (mode === "dark" ? NIGHT_NAME_COLORS[seedOf(name)] : AVATAR_GRADIENTS[seedOf(name)][0]);

export default function getAvatar(avatar, name, size = 40) {
  if (avatar) return <Avatar src={avatar} alt={name} sx={{ width: size, height: size }} />;
  const { initial, background } = avatarLookOf(name);
  return (
    <Avatar
      alt={name}
      sx={{
        width: size,
        height: size,
        background,
        color: "#fff",
        fontWeight: 800,
        fontSize: Math.round(size * 0.42),
        letterSpacing: "-0.02em",
      }}
    >
      {initial}
    </Avatar>
  );
}
