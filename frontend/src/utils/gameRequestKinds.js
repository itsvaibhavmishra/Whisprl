import { Crown, Lightbulb, Sparkle } from "phosphor-react";

export const REQUEST_KINDS = [
  { value: "classic", label: "Classic", choice: "A classic", hint: "Around for years, like Ludo or Uno", Icon: Crown, color: "#F5A524" },
  { value: "new", label: "New", choice: "Something new", hint: "A game people are into lately", Icon: Sparkle, color: "#22C3A6" },
  { value: "original", label: "Own idea", choice: "My own idea", hint: "A game you came up with", Icon: Lightbulb, color: "#A78BFA" },
];

export const kindOf = (value) => REQUEST_KINDS.find((kind) => kind.value === value);
