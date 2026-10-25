// A phone's keyboard shrinks the window rather than covering it, so its height is how far the window falls short of its tallest.
import { useEffect, useState } from "react";

// the least a window must shrink by to be a keyboard rather than a browser bar sliding away
const KEYBOARD_AT_LEAST = 120;

const tallest = new Map();
const listeners = new Set();
let lastKeyboard = 0;

const isTyping = () => document.activeElement?.matches("input, textarea, [contenteditable='true']") ?? false;

const keyboardNow = () => {
  const full = Math.max(tallest.get(window.innerWidth) ?? 0, window.innerHeight);
  tallest.set(window.innerWidth, full);
  // only a field being typed in raises a keyboard, so a window dragged shorter is never taken for one
  const shortBy = isTyping() ? full - window.innerHeight : 0;
  return shortBy >= KEYBOARD_AT_LEAST ? shortBy : 0;
};

keyboardNow();
window.addEventListener("resize", () => {
  lastKeyboard = keyboardNow() || lastKeyboard;
  listeners.forEach((listener) => listener());
});

export const useKeyboardHeight = () => {
  const [height, setHeight] = useState(keyboardNow);
  useEffect(() => {
    const listener = () => setHeight(keyboardNow());
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);
  return height;
};

// the keyboard's height the last time it was up, so a panel standing in for it can open just as tall
export const lastKeyboardHeight = () => lastKeyboard || Math.round(window.innerHeight * 0.4);
