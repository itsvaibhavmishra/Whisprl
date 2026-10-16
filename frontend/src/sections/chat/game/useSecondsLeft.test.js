import { act, renderHook } from "@testing-library/react";

import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("a deadline set long after the first render counts from now, not from when it mounted", () => {
  const { result, rerender } = renderHook(({ until }) => useSecondsLeft(until), { initialProps: { until: null } });
  expect(result.current).toBeNull();

  act(() => jest.advanceTimersByTime(4000));
  rerender({ until: new Date(Date.now() + 5000).toISOString() });
  expect(result.current).toBe(5);

  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toBe(4);
});

test("a passed deadline reads as none", () => {
  const { result } = renderHook(() => useSecondsLeft(new Date(Date.now() - 1000).toISOString()));
  expect(result.current).toBeNull();
});
