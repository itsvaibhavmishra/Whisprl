export default function CssBaseline() {
  return {
    // The window never scrolls behind a modal here, and locking it would pad the page into the reserved scrollbar gutter.
    MuiModal: {
      defaultProps: { disableScrollLock: true },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
        },
        html: {
          width: "100%",
          height: "100%",
          WebkitOverflowScrolling: "touch",
          scrollbarGutter: "stable",
        },
        // the page reaches under a phone's notch, so in landscape the sides step clear of it
        body: {
          width: "100%",
          height: "100%",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        },
        "#root": {
          width: "100%",
          height: "100%",
        },
        // a long press on a touch screen opens a menu here, so it must not also select or highlight what it landed on
        "@media (hover: none) and (pointer: coarse)": {
          body: { userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", WebkitTapHighlightColor: "transparent" },
          'input, textarea, [contenteditable="true"]': { userSelect: "text", WebkitUserSelect: "text" },
        },
        input: {
          "&[type=number]": {
            MozAppearance: "textfield",
            "&::-webkit-outer-spin-button": {
              margin: 0,
              WebkitAppearance: "none",
            },
            "&::-webkit-inner-spin-button": {
              margin: 0,
              WebkitAppearance: "none",
            },
          },
        },
        img: {
          display: "block",
          maxWidth: "100%",
        },
      },
    },
  };
}
