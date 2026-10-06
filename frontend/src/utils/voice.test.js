import { WAVEFORM_BARS, waveformOf } from "@/utils/voice";

test("silence gives a flat waveform of the usual length", () => {
  expect(waveformOf([])).toEqual(Array(WAVEFORM_BARS).fill(0));
});

test("the loudest moment reaches the top, whatever the recording's volume", () => {
  const waveform = waveformOf([0.05, 0.1, 0.2, 0.1], 4);
  expect(waveform).toEqual([25, 50, 100, 50]);
});

test("a long recording is summed up in a fixed number of bars, keeping each stretch's peak", () => {
  const levels = Array.from({ length: 400 }, (_, index) => (index === 123 ? 1 : 0.1));
  const waveform = waveformOf(levels);
  expect(waveform).toHaveLength(WAVEFORM_BARS);
  expect(Math.max(...waveform)).toBe(100);
  expect(waveform.filter((bar) => bar === 100)).toHaveLength(1);
});
