import { applyGameLevels, DEFAULT_GAME_AUDIO, effectsVolume, gameAudioOf, musicVolume } from "@/sections/chat/game/gameSounds";
import { SETTINGS_STORAGE_KEY } from "@/config";

beforeEach(() => {
  localStorage.clear();
  applyGameLevels(DEFAULT_GAME_AUDIO);
});

// this was silent in the app: JSON.parse(null) is null and Number(null) is 0, which read as muted
test("someone who has never touched the sliders hears the effects, and quiet music", () => {
  expect(effectsVolume()).toBe(1);
  expect(musicVolume()).toBe(0.1);
});

test("the levels a game was last set to are the ones it plays at", () => {
  applyGameLevels({ effects: 0.4, music: 0.6 });
  expect(effectsVolume()).toBe(0.4);
  expect(musicVolume()).toBe(0.6);
});

test("each game keeps its own levels, and one never set falls back to the defaults", () => {
  const user = { gameAudio: { "tic-tac-toe": { effects: 0.2, music: 0 } } };
  expect(gameAudioOf(user, "tic-tac-toe")).toEqual({ effects: 0.2, music: 0 });
  expect(gameAudioOf(user, "chain-reaction")).toEqual(DEFAULT_GAME_AUDIO);
  expect(gameAudioOf(undefined, "chain-reaction")).toEqual(DEFAULT_GAME_AUDIO);
});

test("turning sound off across the app silences a game too", () => {
  applyGameLevels({ effects: 1, music: 1 });
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ sounds: false }));
  expect(effectsVolume()).toBe(0);
  expect(musicVolume()).toBe(0);
});
