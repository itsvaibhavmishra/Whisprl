// a ripple fills the whole button as a dark box on a touch screen, so taps answer with each button's own pressed style instead
export default function ButtonBase() {
  return {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
  };
}
