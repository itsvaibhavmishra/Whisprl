import { drawStrokes } from "@/utils/media-editor/draw";

const recordingContext = () => {
  const calls = [];
  const record =
    (name) =>
    (...details) =>
      calls.push([name, ...details]);
  return {
    calls,
    canvas: { width: 100, height: 200 },
    save: record("save"),
    restore: record("restore"),
    clearRect: record("clearRect"),
    beginPath: record("beginPath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    arc: record("arc"),
    rect: record("rect"),
    stroke: record("stroke"),
    fill: record("fill"),
  };
};

const namesOf = (calls) => calls.map(([name]) => name).filter((name) => !["save", "restore", "clearRect", "beginPath"].includes(name));

const tap = (brush) => ({ brush, color: "#ffffff", size: 0.1, points: [[0.5, 0.5]] });

test("a tap is filled as a round dot the width of the brush, never stroked", () => {
  const context = recordingContext();
  drawStrokes(context, [tap("Pen")]);
  expect(namesOf(context.calls)).toEqual(["arc", "fill"]);
  expect(context.calls.find(([name]) => name === "arc")).toEqual(["arc", 50, 100, 5, 0, 2 * Math.PI]);
});

test("a marker's tap is a square, as its lines end square", () => {
  const context = recordingContext();
  drawStrokes(context, [tap("Marker")]);
  expect(namesOf(context.calls)).toEqual(["rect", "fill"]);
});

test("a neon tap gets its glow and its bright core, both filled", () => {
  const context = recordingContext();
  drawStrokes(context, [tap("Neon")]);
  expect(namesOf(context.calls)).toEqual(["arc", "fill", "arc", "fill"]);
});

test("a drawn line is still stroked through its points", () => {
  const context = recordingContext();
  drawStrokes(context, [
    {
      ...tap("Pen"),
      points: [
        [0.1, 0.1],
        [0.4, 0.2],
      ],
    },
  ]);
  expect(namesOf(context.calls)).toEqual(["moveTo", "lineTo", "stroke"]);
});
