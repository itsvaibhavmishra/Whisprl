// letters and digits of any script, accents folded, so "Café", "cafe" and "CAFE!" are one word
export const normalized = (text = "") =>
  String(text)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// "Tic-Tac-Toe", "tic tac toe" and "The TicTacToe" are one game
export const nameKeyOf = (name) => normalized(name).replace(/^the /, "").replaceAll(" ", "");
