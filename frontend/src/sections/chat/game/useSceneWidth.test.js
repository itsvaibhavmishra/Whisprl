import { sceneWidthOf } from "@/sections/chat/game/useSceneWidth";

const ART = { anchor: "top", ratio: 0.5 };
const MASTHEAD_RATIO = 1.2;

test("a phone's scene fills its width", () => {
  expect(sceneWidthOf({ width: 390, height: 760, inset: 0 }, 300, ART, MASTHEAD_RATIO)).toBe(390);
});

test("a wide panel narrows the scene so the controls still fit below the masthead", () => {
  const width = sceneWidthOf({ width: 720, height: 810, inset: 0 }, 470, ART, MASTHEAD_RATIO);
  expect(width).toBeLessThan(720);
  expect(width / MASTHEAD_RATIO + 470).toBeLessThanOrEqual(810);
});

test("a tall narrow panel widens the scene until it reaches the bottom", () => {
  expect(sceneWidthOf({ width: 400, height: 920, inset: 0 }, 470, ART, MASTHEAD_RATIO)).toBe(460);
});

test("the scene never stops short of the bottom, even when the controls would want it narrower", () => {
  expect(sceneWidthOf({ width: 720, height: 810, inset: 0 }, 700, ART, MASTHEAD_RATIO)).toBe(405);
});
