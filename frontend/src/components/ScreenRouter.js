import { startTransition, useLayoutEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Router, UNSAFE_createBrowserHistory as createBrowserHistory } from "react-router-dom";

import { isBackSwipeHeld } from "@/utils/backSwipe";
import { motionBetween, playScreenMotion, stepMotion } from "@/utils/screenMotion";

const history = createBrowserHistory({ v5Compat: true });

// only a step back the app takes itself slides, since the browser's own back already animates on some phones
let appStep = 0;
const goInHistory = history.go;
history.go = (step) => {
  appStep = step;
  goInHistory(step);
};

const motionOf = (action, fromPath, toPath) => {
  if (isBackSwipeHeld()) return null;
  return action === "POP" ? stepMotion(appStep) : motionBetween(fromPath, toPath);
};

const ScreenRouter = ({ children }) => {
  const [shown, setShown] = useState({ action: history.action, location: history.location });

  useLayoutEffect(() => {
    let shownPath = history.location.pathname;
    return history.listen(({ action, location }) => {
      const motion = motionOf(action, shownPath, location.pathname);
      appStep = 0;
      shownPath = location.pathname;
      // the latest entry rather than this one, in case another navigation landed before the slide began
      const show = () => setShown({ action: history.action, location: history.location });
      if (playScreenMotion(motion, () => flushSync(show))) return;
      // a back swipe has already uncovered the screen behind, so it is drawn at once with nothing in between
      if (isBackSwipeHeld()) flushSync(show);
      else startTransition(show);
    });
  }, []);

  return (
    <Router location={shown.location} navigationType={shown.action} navigator={history}>
      {children}
    </Router>
  );
};

export default ScreenRouter;
