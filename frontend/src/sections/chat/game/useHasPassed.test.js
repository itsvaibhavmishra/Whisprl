import { act, renderHook } from "@testing-library/react";

import useHasPassed from "@/sections/chat/game/useHasPassed";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("a moment still to come reads as not passed until it arrives", () => {
  const moment = new Date(Date.now() + 2000).toISOString();
  const { result } = renderHook(() => useHasPassed(moment));
  expect(result.current).toBe(false);

  act(() => jest.advanceTimersByTime(1900));
  expect(result.current).toBe(false);

  act(() => jest.advanceTimersByTime(200));
  expect(result.current).toBe(true);
});

test("a new moment after an old one has passed starts out not passed", () => {
  const { result, rerender } = renderHook(({ moment }) => useHasPassed(moment), { initialProps: { moment: new Date(Date.now() - 1000).toISOString() } });
  expect(result.current).toBe(true);

  rerender({ moment: new Date(Date.now() + 3000).toISOString() });
  expect(result.current).toBe(false);
});

test("with no moment set there is nothing to wait for", () => {
  const { result } = renderHook(() => useHasPassed(null));
  expect(result.current).toBe(true);
});
