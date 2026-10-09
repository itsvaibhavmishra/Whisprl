export const COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#000000" },
  { name: "Blue", value: "#3897f0" },
  { name: "Green", value: "#70c050" },
  { name: "Yellow", value: "#fdcb5c" },
  { name: "Orange", value: "#fd8d32" },
  { name: "Red", value: "#ed4956" },
  { name: "Pink", value: "#d10869" },
  { name: "Purple", value: "#a307ba" },
];

export const GRADIENTS = [
  { name: "Sunset", stops: ["#f58529", "#dd2a7b", "#8134af"] },
  { name: "Ocean", stops: ["#1d6fa5", "#2193b0", "#6dd5ed"] },
  { name: "Lime", stops: ["#1e7a3c", "#56ab2f", "#a8e063"] },
  { name: "Berry", stops: ["#4a00e0", "#8e2de2", "#d10869"] },
  { name: "Peach", stops: ["#de6262", "#ff8a65", "#ffb88c"] },
  { name: "Night", stops: ["#141e30", "#243b55", "#3a4a63"] },
];

export const inkOn = (hex) => {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  return 0.299 * red + 0.587 * green + 0.114 * blue > 160 ? "#000000" : "#ffffff";
};
