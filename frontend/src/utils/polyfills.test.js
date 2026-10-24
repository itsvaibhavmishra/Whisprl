import vm from "vm";

import SOURCE from "@/utils/polyfills.js?raw";

const MISSING = ["Array.prototype.at", "String.prototype.at", "Array.prototype.findLast", "Array.prototype.findLastIndex", "Object.hasOwn"];

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

// a realm of its own, so taking built-ins away never reaches the ones the test runner relies on
const oldWebView = (prepare = "") => {
  const realm = vm.createContext({ CanvasRenderingContext2D: FakeContext });
  vm.runInContext(MISSING.map((path) => `delete ${path};`).join("") + prepare, realm);
  vm.runInContext(SOURCE, realm);
  return (code) => vm.runInContext(code, realm);
};

const run = oldWebView();

test("at counts back from the end for a negative index, on arrays and strings", () => {
  expect(run("[1, 2, 3].at(-1)")).toBe(3);
  expect(run("[1, 2, 3].at(0)")).toBe(1);
  expect(run("[1, 2, 3].at(5)")).toBeUndefined();
  expect(run("[].at(-1)")).toBeUndefined();
  expect(run('"abc".at(-2)')).toBe("b");
});

test("findLast and findLastIndex search from the end", () => {
  expect(run("[1, 4, 2, 5, 3].findLast((number) => number % 2 === 0)")).toBe(2);
  expect(run("[1, 4, 2, 5, 3].findLastIndex((number) => number % 2 === 0)")).toBe(2);
  expect(run("[1, 4, 2, 5, 3].findLast((number) => number > 9)")).toBeUndefined();
  expect(run("[1, 4, 2, 5, 3].findLastIndex((number) => number > 9)")).toBe(-1);
});

test("hasOwn ignores what an object only inherits", () => {
  expect(run('Object.hasOwn({ name: "Ava" }, "name")')).toBe(true);
  expect(run('Object.hasOwn({}, "toString")')).toBe(false);
});

test("roundRect traces a closed box with its corners rounded", () => {
  const context = new FakeContext();
  context.roundRect(0, 0, 100, 40, 10);
  expect(context.steps[0]).toEqual(["moveTo", 10, 0]);
  expect(context.steps.filter(([step]) => step === "arcTo")).toHaveLength(4);
  expect(context.steps.at(-1)).toEqual(["closePath"]);
});

test("a browser's own method is kept", () => {
  const ownAt = oldWebView('Object.defineProperty(Array.prototype, "at", { value: () => "own", writable: true, configurable: true });');
  expect(ownAt("[].at(0)")).toBe("own");
});
