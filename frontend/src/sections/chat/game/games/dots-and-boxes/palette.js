// six colours that stay apart on cream paper, in order round the wheel so the server's spread deal pairs opposites
const PALETTE = ["#E24B42", "#E8872A", "#3DA35D", "#1AA0A8", "#2E6FD4", "#7B4FC4"];

// the deal lives in the board's state, so everyone at the table sees the same colours
export const colourOf = (state, seat) => PALETTE[state?.colours?.[seat] ?? seat];

export default PALETTE;
