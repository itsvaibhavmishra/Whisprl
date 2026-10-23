import layout from "@/sections/chat/game/games/jackaroo/layout.json";

// the six colours the marbles were rendered in, in order round the wheel so the server's spread deal pairs opposites
const PALETTE = layout.palette;

// the deal lives in the board's state, so everyone at the table sees the same colours
export const toneOf = (state, seat) => state?.colours?.[seat] ?? seat * 3;

export const colourOf = (state, seat) => PALETTE[toneOf(state, seat)];

export default PALETTE;
