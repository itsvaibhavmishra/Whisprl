const loaded = new Set();

// fetched the first time the game opens, as the media editor's fonts are, so nobody who never plays it downloads them
export const loadGameFonts = (fonts) => {
  if (!fonts || loaded.has(fonts.href)) return;
  loaded.add(fonts.href);
  document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: fonts.href }));
};

export const bodyFontOf = (theme) => theme.fonts && `"${theme.fonts.body}", Manrope, sans-serif`;

export const displayFontOf = (theme) => theme.fonts && `"${theme.fonts.display}", Georgia, serif`;

// the room's own theme, with every type style in the game's body font, so a part that asks for the display font still wins
export const withBodyFont = (font) => (outer) => ({
  ...outer,
  typography: {
    ...Object.fromEntries(Object.entries(outer.typography).map(([name, style]) => [name, style?.fontFamily ? { ...style, fontFamily: font } : style])),
    fontFamily: font,
  },
});
