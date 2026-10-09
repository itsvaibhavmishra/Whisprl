import { isSignUpPaused, pauseSignUp } from "@/utils/signUpPause";

afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
});

test("a refused sign up stays paused on this browser for a day", () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 9, 12));
  expect(isSignUpPaused()).toBe(false);
  pauseSignUp();
  expect(isSignUpPaused()).toBe(true);
  jest.setSystemTime(new Date(2026, 9, 10, 12, 1));
  expect(isSignUpPaused()).toBe(false);
});
