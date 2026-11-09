const CARD_WIDTH = 360;
const GAP = 16;
const GUTTER = 16;

const clamp = (value, low, high) => Math.min(Math.max(value, low), Math.max(low, high));

// beside a side bar, above anything in the lower half such as the phone's tabs, and below anything else
export const cardPlacement = (target, viewport) => {
  const width = Math.min(CARD_WIDTH, viewport.width - GUTTER * 2);
  if (!target) return { width, left: (viewport.width - width) / 2, top: "50%", transform: "translateY(-50%)" };

  const isBesideRail = target.right < viewport.width / 4 && target.width < viewport.width / 4 && viewport.width > width + target.right + GAP;
  if (isBesideRail) return { width, left: target.right + GAP, top: Math.max(GUTTER, target.top - GAP) };

  const left = clamp(target.left + target.width / 2 - width / 2, GUTTER, viewport.width - width - GUTTER);
  const isLow = target.top + target.height / 2 > viewport.height / 2;
  return isLow ? { width, left, bottom: viewport.height - target.top + GAP } : { width, left, top: target.bottom + GAP };
};
