// six hues spread around the wheel and lit for a night sky, so a crowded board still tells them apart
const PALETTE = ["#FF4D5E", "#FFB627", "#3EE08F", "#2EC8FF", "#8F72FF", "#FF5CC8"];

// the deal lives in the board's state, so everyone at the table sees the same colours
export const toneOf = (state, seat) => state?.colours?.[seat] ?? seat;

export const colourOf = (state, seat) => PALETTE[toneOf(state, seat)];

export default PALETTE;
