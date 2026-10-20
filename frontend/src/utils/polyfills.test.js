const MISSING = [
  [Array.prototype, "at"],
  [String.prototype, "at"],
  [Array.prototype, "findLast"],
  [Array.prototype, "findLastIndex"],
  [Object, "hasOwn"],
];
const natives = MISSING.map(([owner, name]) => [owner, name, Object.getOwnPropertyDescriptor(owner, name)]);

class FakeContext {
  constructor() {
    this.steps = [];
  }
  moveTo(...point) {
    this.steps.push(["moveTo", ...point]);
  }
  arcTo(...arc) {
    this.steps.push(["arcTo", ...arc]);
  }
  closePath() {
    this.steps.push(["closePath"]);
  }
}

beforeAll(() => {
  MISSING.forEach(([owner, name]) => delete owner[name]);
  global.CanvasRenderingContext2D = FakeContext;
  jest.isolateModules(() => require("@/utils/polyfills"));
});

afterAll(() => {
  natives.forEach(([owner, name, descriptor]) => Object.defineProperty(owner, name, descriptor));
  delete global.CanvasRenderingContext2D;
});

test("at counts back from the end for a negative index, on arrays and strings", () => {
  expect([1, 2, 3].at(-1)).toBe(3);
  expect([1, 2, 3].at(0)).toBe(1);
  expect([1, 2, 3].at(5)).toBeUndefined();
  expect([].at(-1)).toBeUndefined();
  expect("abc".at(-2)).toBe("b");
});

test("findLast and findLastIndex search from the end", () => {
  const numbers = [1, 4, 2, 5, 3];
  expect(numbers.findLast((number) => number % 2 === 0)).toBe(2);
  expect(numbers.findLastIndex((number) => number % 2 === 0)).toBe(2);
  expect(numbers.findLast((number) => number > 9)).toBeUndefined();
  expect(numbers.findLastIndex((number) => number > 9)).toBe(-1);
});

test("hasOwn ignores what an object only inherits", () => {
  expect(Object.hasOwn({ name: "Ava" }, "name")).toBe(true);
  expect(Object.hasOwn({}, "toString")).toBe(false);
});

test("roundRect traces a closed box with its corners rounded", () => {
  const context = new FakeContext();
  context.roundRect(0, 0, 100, 40, 10);
  expect(context.steps[0]).toEqual(["moveTo", 10, 0]);
  expect(context.steps.filter(([step]) => step === "arcTo")).toHaveLength(4);
  expect(context.steps.at(-1)).toEqual(["closePath"]);
});

test("a browser's own method is kept", () => {
  const filledIn = Object.getOwnPropertyDescriptor(Array.prototype, "at");
  Object.defineProperty(Array.prototype, "at", { value: () => "own", writable: true, configurable: true });
  jest.isolateModules(() => require("@/utils/polyfills"));
  expect([].at(0)).toBe("own");
  Object.defineProperty(Array.prototype, "at", filledIn);
});
