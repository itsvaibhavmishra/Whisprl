const GOOGLE_FONTS =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Pacifico&family=Courier+Prime:wght@700&family=Archivo+Black&family=Playfair+Display:ital,wght@1,700&family=Comic+Neue:wght@700&family=Bebas+Neue&display=swap";

export const TEXT_FONTS = [
  { name: "Classic", family: "Manrope", weight: 800 },
  { name: "Modern", family: "Montserrat", weight: 700, isCapitals: true },
  { name: "Neon", family: "Pacifico", weight: 400, glows: true },
  { name: "Typewriter", family: "Courier Prime", weight: 700 },
  { name: "Strong", family: "Archivo Black", weight: 400, isCapitals: true },
  { name: "Serif", family: "Playfair Display", weight: 700, isItalic: true },
  { name: "Comic", family: "Comic Neue", weight: 700 },
  { name: "Poster", family: "Bebas Neue", weight: 400, isCapitals: true },
];

export const fontNamed = (name) => TEXT_FONTS.find((font) => font.name === name) ?? TEXT_FONTS[0];

export const cssFontOf = (font, size) => `${font.isItalic ? "italic" : "normal"} ${font.weight} ${size}px "${font.family}"`;

let loading = null;

// a canvas draws with whichever font is ready, so every font is awaited before text is measured or drawn
export const loadEditorFonts = () => {
  loading ??= new Promise((resolve) => {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: GOOGLE_FONTS, onload: resolve, onerror: resolve });
    document.head.append(link);
  }).then(() => Promise.all(TEXT_FONTS.map((font) => document.fonts.load(cssFontOf(font, 48)).catch(() => []))));
  return loading;
};
