import breakpoints from "@/theme/breakpoints";

export const PUSH = "push";
export const BACK = "back";
export const NEXT_TAB = "next-tab";
export const PREVIOUS_TAB = "previous-tab";

// the order of the phone's tab bar, which decides which way a tab switch slides
const TABS = ["chat", "status", "contacts", "settings"];

const NARROW = `(max-width: ${breakpoints.values.md - 0.05}px)`;

// a chat's details open in a drawer of their own, so the screen under it stays where it is
const screenOf = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts[0] === "chat" && parts[2] === "info" ? parts.slice(0, 2) : parts;
};

export const motionBetween = (fromPath, toPath) => {
  const from = screenOf(fromPath);
  const to = screenOf(toPath);
  if (from.join("/") === to.join("/")) return null;
  if (to[0] === "docs") return from[0] === "docs" ? null : PUSH;
  if (from[0] === "docs") return BACK;

  const fromTab = TABS.indexOf(from[0]);
  const toTab = TABS.indexOf(to[0]);
  if (fromTab < 0 || toTab < 0) return null;
  if (fromTab === toTab) {
    if (to.length === from.length) return null;
    return to.length > from.length ? PUSH : BACK;
  }
  if (to.length > 1) return PUSH;
  return toTab > fromTab ? NEXT_TAB : PREVIOUS_TAB;
};

export const stepMotion = (step) => (step < 0 ? BACK : null);

export const canPlayScreenMotion = () =>
  Boolean(document.startViewTransition) && window.matchMedia(NARROW).matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let playing = null;

// the browser pictures the screen before and after, and slides the pictures while the page itself never moves
export const startScreenMotion = (motion, update) => {
  const root = document.documentElement;
  root.dataset.screenMotion = motion;
  const transition = document.startViewTransition(update);
  playing = transition;
  transition.finished.finally(() => {
    if (playing === transition) delete root.dataset.screenMotion;
  });
  return transition;
};

export const playScreenMotion = (motion, update) => {
  if (!motion || !canPlayScreenMotion()) return false;
  startScreenMotion(motion, update);
  return true;
};
