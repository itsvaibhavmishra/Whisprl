// the faces a chosen bot can wear; they share one skill and differ only in look, name and voice
export const PERSONAS = ["bleep", "wini", "pip", "zook", "pogo"];

const anyOf = (choices, random) => choices[Math.floor(random() * choices.length)];

// one nobody else at the table is wearing, and where it can, not the one this seat wore last game
export const freshPersona = (seats, random = Math.random, last = null) => {
  const worn = seats.map((seat) => seat.persona);
  const free = PERSONAS.filter((persona) => !worn.includes(persona));
  const unlike = free.filter((persona) => persona !== last);
  return anyOf(
    [unlike, free, PERSONAS].find((choices) => choices.length),
    random
  );
};
