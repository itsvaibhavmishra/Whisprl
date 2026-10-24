import { CrownIcon, LightbulbIcon, SparkleIcon } from "@phosphor-icons/react";

export const REQUEST_KINDS = [
  { value: "classic", label: "Classic", choice: "A classic", hint: "Around for years, like Ludo or Uno", Icon: CrownIcon, color: "#F5A524" },
  { value: "new", label: "New", choice: "Something new", hint: "A game people are into lately", Icon: SparkleIcon, color: "#22C3A6" },
  { value: "original", label: "Own idea", choice: "My own idea", hint: "A game you came up with", Icon: LightbulbIcon, color: "#A78BFA" },
];

export const kindOf = (value) => REQUEST_KINDS.find((kind) => kind.value === value);
