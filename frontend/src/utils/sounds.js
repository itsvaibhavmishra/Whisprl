import { SETTINGS_STORAGE_KEY } from "@/config";

const QUIET_GAP_MS = 1500;

const players = {};
const lastHeardAt = {};

const playerFor = (name) => {
  players[name] ??= Object.assign(new Audio(`${process.env.PUBLIC_URL}/sounds/${name}.mp3`), { preload: "auto" });
  return players[name];
};

const soundsOn = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY))?.sounds !== false;
  } catch {
    return true;
  }
};

// a browser refuses to play before the person has interacted with the page, and that is fine to skip
const play = (name) => {
  const player = playerFor(name);
  player.currentTime = 0;
  player.play().catch(() => {});
};

// each kind sounds once per burst, so a busy chat stays quiet until it pauses, without one kind silencing another
export const playSound = (name) => {
  const isBurst = Date.now() - (lastHeardAt[name] ?? 0) < QUIET_GAP_MS;
  lastHeardAt[name] = Date.now();
  if (soundsOn() && !isBurst) play(name);
};

export const previewSound = () => play("elsewhere");
