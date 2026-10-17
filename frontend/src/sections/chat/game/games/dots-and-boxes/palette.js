// six colours that stay apart from each other on cream paper, dealt to seats when a game starts
const PALETTE = ["#2E6FD4", "#E24B42", "#3DA35D", "#E8872A", "#7B4FC4", "#1AA0A8"];

// the deal lives in the board's state, so everyone at the table sees the same colours
export const colourOf = (state, seat) => PALETTE[state?.colours?.[seat] ?? seat];

export default PALETTE;
