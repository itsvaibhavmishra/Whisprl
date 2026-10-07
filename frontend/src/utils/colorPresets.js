export const NIGHT_INK = "#06182A";

// each accent has a deep day tone that keeps white bubble text readable, and a luminous night tone with dark text on it
export const colorPresets = [
  {
    name: "default",
    label: "Halo",
    lighter: "#D6F1FD",
    light: "#5CC8F2",
    main: "#0979C2",
    dark: "#075C94",
    darker: "#053E66",
    contrastText: "#fff",
    bubble: ["#0A6CB3", "#3E5BDB"],
    glow: "#22D3EE",
    night: { lighter: "#CFF2FD", light: "#8ADDF8", main: "#4CC3F0", dark: "#22A6DB", darker: "#0E7FB0", contrastText: NIGHT_INK },
  },
  {
    name: "purple",
    label: "Violet",
    lighter: "#EDE5FE",
    light: "#A88BF2",
    main: "#7444E0",
    dark: "#5229B8",
    darker: "#34177C",
    contrastText: "#fff",
    bubble: ["#7444E0", "#C2399E"],
    glow: "#B794FF",
    night: { lighter: "#EEE7FE", light: "#C9B6FA", main: "#A98CF5", dark: "#8C68EE", darker: "#6A45D6", contrastText: "#1D0B47" },
  },
  {
    name: "cyan",
    label: "Lagoon",
    lighter: "#D5F7F1",
    light: "#4FD1C0",
    main: "#0B7F75",
    dark: "#075E57",
    darker: "#043F3A",
    contrastText: "#fff",
    bubble: ["#0B7F75", "#1F6FB8"],
    glow: "#3EE6CF",
    night: { lighter: "#D2F7F1", light: "#7EE3D5", main: "#3CCFBC", dark: "#1FB3A1", darker: "#128C7E", contrastText: "#032B27" },
  },
  {
    name: "blue",
    label: "Cobalt",
    lighter: "#DDE6FD",
    light: "#6F93F2",
    main: "#2453D6",
    dark: "#1A3BA0",
    darker: "#10266B",
    contrastText: "#fff",
    bubble: ["#2453D6", "#5A2FC9"],
    glow: "#7AA2FF",
    night: { lighter: "#E1E8FD", light: "#A9BEF9", main: "#7D9DF6", dark: "#5B80F0", darker: "#3A5FD8", contrastText: "#0B1A4A" },
  },
  {
    name: "orange",
    label: "Sunset",
    lighter: "#FDEBDC",
    light: "#F59E57",
    main: "#C2560F",
    dark: "#933F08",
    darker: "#622805",
    contrastText: "#fff",
    bubble: ["#C2560F", "#C2264E"],
    glow: "#FFB46B",
    night: { lighter: "#FDE9D7", light: "#FAC08F", main: "#F7A25E", dark: "#F08734", darker: "#D26A17", contrastText: "#3A1702" },
  },
  {
    name: "red",
    label: "Rose",
    lighter: "#FDE2E8",
    light: "#F07893",
    main: "#C8264B",
    dark: "#951A37",
    darker: "#621024",
    contrastText: "#fff",
    bubble: ["#C8264B", "#8A2BC0"],
    glow: "#FF8FA8",
    night: { lighter: "#FDE3E9", light: "#F7A9BB", main: "#F27D98", dark: "#EC5A7C", darker: "#D13A5F", contrastText: "#3F0815" },
  },
];

export const defaultPreset = colorPresets[0];

const presetNamed = (name) => colorPresets.find((preset) => preset.name === name) ?? defaultPreset;

export const primaryFor = (name, mode) => {
  const { night, ...day } = presetNamed(name);
  const tones = mode === "dark" ? { ...day, ...night } : day;
  return { ...tones, lighterFaded: `${tones.main}40` };
};
