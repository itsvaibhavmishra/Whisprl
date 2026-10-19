export default function CssBaseline() {
  return {
    // The window never scrolls behind a modal here, and locking it would pad the page into the reserved scrollbar gutter.
    MuiModal: {
      defaultProps: { disableScrollLock: true },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable',
        },
        // the page reaches under a phone's notch, so in landscape the sides step clear of it
        body: {
          width: '100%',
          height: '100%',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        // on a phone the toasts sit a fixed 20px from the top, which is under the status bar once the page reaches behind it
        '@media (max-width: 600px)': {
          "body [data-sonner-toaster][data-y-position='top']": { top: 'calc(20px + env(safe-area-inset-top))' },
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
        img: {
          display: 'block',
          maxWidth: '100%',
        },
      },
    },
  };
}
