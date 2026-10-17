import { effectsVolume, EFFECTS_KEY, musicVolume, MUSIC_KEY } from "@/sections/chat/game/gameSounds";
import { SETTINGS_STORAGE_KEY } from "@/config";

beforeEach(() => localStorage.clear());

// this was silent in the app: JSON.parse(null) is null and Number(null) is 0, which read as muted
test("someone who has never touched the sliders still hears the effects", () => {
  expect(effectsVolume()).toBe(1);
  expect(musicVolume()).toBe(0);
});

test("a level that was chosen is used, and one out of range is pulled back in", () => {
  localStorage.setItem(EFFECTS_KEY, "0.4");
  expect(effectsVolume()).toBe(0.4);
  localStorage.setItem(EFFECTS_KEY, "7");
  expect(effectsVolume()).toBe(1);
  localStorage.setItem(MUSIC_KEY, "0.6");
  expect(musicVolume()).toBe(0.6);
});

test("rubbish in the store falls back rather than throwing", () => {
  localStorage.setItem(EFFECTS_KEY, "not a number");
  expect(effectsVolume()).toBe(1);
});

test("turning sound off across the app silences a game too", () => {
  localStorage.setItem(EFFECTS_KEY, "1");
  localStorage.setItem(MUSIC_KEY, "1");
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ sounds: false }));
  expect(effectsVolume()).toBe(0);
  expect(musicVolume()).toBe(0);
});
