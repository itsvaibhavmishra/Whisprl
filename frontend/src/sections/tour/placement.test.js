import { cardPlacement } from "@/sections/tour/placement";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

test("with nothing to point at, the card sits in the middle", () => {
  expect(cardPlacement(null, DESKTOP)).toMatchObject({ width: 360, left: 540, top: "50%" });
});

test("a tab at the bottom of a phone gets the card above it, kept inside the screen", () => {
  const tab = { left: 300, right: 390, top: 780, bottom: 844, width: 90, height: 64 };
  expect(cardPlacement(tab, PHONE)).toEqual({ width: 358, left: 16, bottom: 80 });
});

test("an item in the side bar gets the card to its right", () => {
  const railItem = { left: 16, right: 64, top: 200, bottom: 248, width: 48, height: 48 };
  expect(cardPlacement(railItem, DESKTOP)).toEqual({ width: 360, left: 80, top: 184 });
});

test("a chat header at the top gets the card below it", () => {
  const header = { left: 0, right: 390, top: 20, bottom: 84, width: 390, height: 64 };
  expect(cardPlacement(header, PHONE)).toEqual({ width: 358, left: 16, top: 100 });
});
