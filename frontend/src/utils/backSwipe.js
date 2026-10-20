import { BACK, canPlayScreenMotion, startScreenMotion } from "@/utils/screenMotion";

const SETTLE_RATE = 1.6;

const slideParts = () => document.getAnimations().filter((animation) => animation.effect?.pseudoElement?.startsWith("::view-transition"));

const whenAllEnd = (animations) => Promise.all(animations.map((animation) => animation.finished));

// a navigation made while the swipe still shows the screen behind needs no slide of its own
export const isBackSwipeHeld = () => "backPreview" in document.documentElement.dataset;

// the slide back held where the finger is, with the chat still mounted under its picture, so letting go early costs nothing
export const startBackSwipe = () => {
  if (!canPlayScreenMotion()) return null;
  const root = document.documentElement;
  const transition = startScreenMotion(BACK, () => {
    root.dataset.backPreview = "";
  });
  let progress = 0;
  let parts = [];

  const seek = () =>
    parts.forEach((animation) => {
      animation.currentTime = progress * animation.effect.getComputedTiming().duration;
    });

  const held = transition.ready
    .then(() => {
      parts = slideParts();
      // the finger sets the pace, so the curve the slide normally eases along would only make it lag behind
      parts.forEach((animation) => {
        animation.pause();
        animation.effect.updateTiming({ easing: "linear" });
      });
      seek();
    })
    .catch(() => {});

  const settle = (isGoingBack) =>
    held.then(() => {
      parts.forEach((animation) => {
        const isThere = isGoingBack ? animation.currentTime >= animation.effect.getComputedTiming().duration : animation.currentTime <= 0;
        animation.playbackRate = isGoingBack ? SETTLE_RATE : -SETTLE_RATE;
        // playing on from the end it is heading for would start it over from the other one
        if (isThere) animation.finish();
        else animation.play();
      });
      return whenAllEnd(parts);
    });

  return {
    follow: (next) => {
      progress = next;
      seek();
    },
    complete: (goBack) =>
      settle(true).then(() => {
        goBack();
        delete root.dataset.backPreview;
      }),
    // the chat comes back from under its picture before the picture goes, so nothing flickers
    cancel: () =>
      settle(false).then(() => {
        delete root.dataset.backPreview;
      }),
  };
};
