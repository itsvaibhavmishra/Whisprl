import { SETTINGS_STORAGE_KEY } from "@/config";

export const GAME_SOUND_KEY = "game-sound";

const LEVEL = 0.12;
// a result plays once the move that decided it has landed, rather than over it
const AFTER_LAST_MOVE = 0.26;

let context = null;

// one context for every game, made on first use since a browser only allows it after the person has tapped
const audio = () => {
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
};

const readFlag = (key, read) => {
  try {
    return read(JSON.parse(localStorage.getItem(key)));
  } catch {
    return true;
  }
};

const isHeard = () => readFlag(SETTINGS_STORAGE_KEY, (settings) => settings?.sounds !== false) && readFlag(GAME_SOUND_KEY, (isOn) => isOn !== false);

const note = (frequency, startIn, length, { type = "sine", level = LEVEL } = {}) => {
  const ctx = audio();
  const startsAt = ctx.currentTime + startIn;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  gain.gain.setValueAtTime(0, startsAt);
  gain.gain.linearRampToValueAtTime(level, startsAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + length);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + length + 0.02);
};

// a short burst of filtered noise, which is what a stroke of chalk on a board sounds like
const scratch = (centre, length) => {
  const ctx = audio();
  const samples = Math.floor(ctx.sampleRate * length);
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < samples; index += 1) channel[index] = (Math.random() * 2 - 1) * (1 - index / samples);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = centre;
  filter.Q.value = 1.4;
  gain.gain.value = LEVEL * 2.2;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
};

const CUES = {
  tick: () => note(660, 0, 0.09),
  start: () => {
    note(660, 0, 0.12);
    note(990, 0.1, 0.22);
  },
  // a beat after the move that handed the turn over, so the two do not blur
  yourTurn: () => {
    note(880, 0.18, 0.12, { level: LEVEL * 0.7 });
    note(1320, 0.27, 0.18, { level: LEVEL * 0.7 });
  },
  won: () => [523, 659, 784, 1047].forEach((frequency, index) => note(frequency, AFTER_LAST_MOVE + index * 0.11, 0.3, { type: "triangle" })),
  lost: () => [392, 330, 262].forEach((frequency, index) => note(frequency, AFTER_LAST_MOVE + index * 0.14, 0.32, { type: "triangle" })),
  drawn: () => [440, 440].forEach((frequency, index) => note(frequency, AFTER_LAST_MOVE + index * 0.16, 0.2, { type: "triangle" })),
  chalk: () => {
    scratch(2600, 0.07);
    setTimeout(() => scratch(2200, 0.06), 90);
  },
};

export const playGameSound = (name) => {
  if (!isHeard() || !CUES[name]) return;
  try {
    CUES[name]();
  } catch {
    // a browser without Web Audio simply plays the game in silence
  }
};
