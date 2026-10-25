import { renderHook } from "@testing-library/react";

import useStageGestures from "@/components/media-editor/useStageGestures";

const SIZE = { width: 300, height: 600 };
const BRUSH = { name: "Pen", color: "#ffffff", size: 10 };
const CIRCLE_POINTS = 73;

const touchAt = (pointerId, clientX, clientY) => ({
  pointerId,
  pointerType: "touch",
  button: 0,
  clientX,
  clientY,
  target: { closest: () => null },
  currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0 }), setPointerCapture: () => {} },
});

const setup = () => {
  const onStrokeEnd = vi.fn();
  const onLiveStroke = vi.fn();
  const { result } = renderHook(() => useStageGestures({ size: SIZE, layers: [], brush: BRUSH, onLiveStroke, onStrokeEnd, onLayerChange: vi.fn() }));
  return { ...result.current, onStrokeEnd };
};

const lastPointsOf = (onStrokeEnd) => onStrokeEnd.mock.calls.at(-1)[0].points;

test("a resting finger that drifts a little, then two more land, makes a circle", () => {
  const { handlers, onStrokeEnd } = setup();
  handlers.onPointerDown(touchAt(1, 100, 200));
  handlers.onPointerMove(touchAt(1, 108, 203));
  handlers.onPointerDown(touchAt(2, 150, 260));
  handlers.onPointerDown(touchAt(3, 120, 320));
  handlers.onPointerUp(touchAt(1, 108, 203));
  handlers.onPointerUp(touchAt(2, 150, 260));
  handlers.onPointerUp(touchAt(3, 120, 320));
  expect(lastPointsOf(onStrokeEnd)).toHaveLength(CIRCLE_POINTS);
});

test("two fingers that land on the spot make a line between them", () => {
  const { handlers, onStrokeEnd } = setup();
  handlers.onPointerDown(touchAt(1, 60, 80));
  handlers.onPointerDown(touchAt(2, 200, 300));
  handlers.onPointerUp(touchAt(2, 200, 300));
  handlers.onPointerUp(touchAt(1, 60, 80));
  expect(lastPointsOf(onStrokeEnd)).toHaveLength(2);
});

test("a single tap with a small wobble stays one point, which becomes a dot", () => {
  const { handlers, onStrokeEnd } = setup();
  handlers.onPointerDown(touchAt(1, 100, 100));
  handlers.onPointerMove(touchAt(1, 102, 101));
  handlers.onPointerUp(touchAt(1, 102, 101));
  expect(lastPointsOf(onStrokeEnd)).toHaveLength(1);
});

test("a finger that has really drawn a line is not turned into a shape by a finger landing", () => {
  const { handlers, onStrokeEnd } = setup();
  handlers.onPointerDown(touchAt(1, 10, 10));
  handlers.onPointerMove(touchAt(1, 60, 10));
  handlers.onPointerMove(touchAt(1, 120, 10));
  handlers.onPointerDown(touchAt(2, 200, 300));
  handlers.onPointerUp(touchAt(2, 200, 300));
  handlers.onPointerUp(touchAt(1, 120, 10));
  const points = lastPointsOf(onStrokeEnd);
  expect(points.length).toBeGreaterThan(2);
  expect(points).toContainEqual([120 / SIZE.width, 10 / SIZE.height]);
});
