const PAUSED_UNTIL_KEY = "signUpPausedUntil";
const PAUSE_MS = 24 * 60 * 60 * 1000;

export const isSignUpPaused = () => {
  try {
    return Number(localStorage.getItem(PAUSED_UNTIL_KEY)) > Date.now();
  } catch {
    return false;
  }
};

// a refused age is remembered on this browser, so going back to the form cannot simply try an older year
export const pauseSignUp = () => {
  try {
    localStorage.setItem(PAUSED_UNTIL_KEY, String(Date.now() + PAUSE_MS));
  } catch {
    // without storage the pause lasts only while this page stays open
  }
};
