const SMALL_WINDOW = "popup,width=520,height=720";

// a computer gets a small window and a phone a new tab, and coming back from either is the cue to carry on
export const openThenReturn = (url, onReturn) => {
  const comeBack = () => {
    if (document.visibilityState !== "visible") return;
    window.removeEventListener("focus", comeBack);
    document.removeEventListener("visibilitychange", comeBack);
    onReturn();
  };
  window.addEventListener("focus", comeBack);
  document.addEventListener("visibilitychange", comeBack);
  // a browser that refuses a new window opens the page in this one instead
  if (!window.open(url, "_blank", SMALL_WINDOW)) window.location.assign(url);
};
