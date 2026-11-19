// Play keeps its own lobby colours in both modes, whatever accent someone picks for their chats
const LOBBY = {
  light: { page: "#FFFFFF", ink: "#1B1D29", muted: "#8A8FA3", chip: "#F4F4F8" },
  dark: { page: "#12131C", ink: "#F2F3F8", muted: "#9096AC", chip: "#1E2030" },
};

// each game's banner in one saturated colour of its own, so the four cards never blur together
export const BANNERS = {
  jackaroo: "#F58A12",
  "chain-reaction": "#3478F0",
  "dots-and-boxes": "#16AF9C",
  "tic-tac-toe": "#7C52EE",
};

export const lobbyOf = (theme) => LOBBY[theme.palette.mode];
