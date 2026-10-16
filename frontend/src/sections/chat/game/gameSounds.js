import { SETTINGS_STORAGE_KEY } from "@/config";

export const EFFECTS_KEY = "game-effects-volume";
export const MUSIC_KEY = "game-music-volume";

// a pad held under a game is wearing at the level a move lands at, so the same number means a quieter chord
const EFFECTS_LEVEL = 0.12;
const MUSIC_LEVEL = 0.05;
// a result plays once the move that decided it has landed, rather than over it
const AFTER_LAST_MOVE = 0.26;

let context = null;

// one context for every game, made on first use since a browser only allows it after the person has tapped
const audio = () => {
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
};

const readLevel = (key, fallback) => {
  try {
    const saved = Number(JSON.parse(localStorage.getItem(key)));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : fallback;
  } catch {
    return fallback;
  }
};

// the app's own sound setting still wins, so turning sound off everywhere turns a game quiet too
const isAppSoundOn = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY))?.sounds !== false;
  } catch {
    return true;
  }
};

export const effectsVolume = () => (isAppSoundOn() ? readLevel(EFFECTS_KEY, 1) : 0);

export const musicVolume = () => (isAppSoundOn() ? readLevel(MUSIC_KEY, 0) : 0);

const note = (frequency, startIn, length, { type = "sine", level = 1 } = {}) => {
  const ctx = audio();
  const startsAt = ctx.currentTime + startIn;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  gain.gain.setValueAtTime(0, startsAt);
  gain.gain.linearRampToValueAtTime(EFFECTS_LEVEL * level * effectsVolume(), startsAt + 0.01);
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
  gain.gain.value = EFFECTS_LEVEL * 2.2 * effectsVolume();
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
    note(880, 0.18, 0.12, { level: 0.7 });
    note(1320, 0.27, 0.18, { level: 0.7 });
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
  if (!effectsVolume() || !CUES[name]) return;
  try {
    CUES[name]();
  } catch {
    // a browser without Web Audio simply plays the game in silence
  }
};

// a slow chord that drifts, generated here rather than shipped, so a game still carries no audio file
const PAD = [196, 294, 392, 587];
let music = null;

export const stopMusic = () => {
  if (!music) return;
  const { ctx, gain, voices } = music;
  music = null;
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  voices.forEach((voice) => voice.stop(ctx.currentTime + 0.7));
};

export const setMusicLevel = (level) => {
  if (!music) return;
  music.gain.gain.linearRampToValueAtTime(MUSIC_LEVEL * level, music.ctx.currentTime + 0.3);
};

export const startMusic = () => {
  if (music || !musicVolume()) return;
  try {
    const ctx = audio();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(MUSIC_LEVEL * musicVolume(), ctx.currentTime + 2.5);
    gain.connect(ctx.destination);

    const voices = PAD.map((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const sway = ctx.createOscillator();
      const depth = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      // a slow wobble per voice, so the chord breathes instead of sitting still
      sway.frequency.setValueAtTime(0.05 + index * 0.017, ctx.currentTime);
      depth.gain.setValueAtTime(1.4, ctx.currentTime);
      sway.connect(depth).connect(oscillator.frequency);
      oscillator.connect(gain);
      oscillator.start();
      sway.start();
      return oscillator;
    });
    music = { ctx, gain, voices };
  } catch {
    // no Web Audio means no music, which is not worth telling anyone about
  }
};
