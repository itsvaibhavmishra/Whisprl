import { SETTINGS_STORAGE_KEY } from "@/config";

export const EFFECTS_KEY = "game-effects-volume";
export const MUSIC_KEY = "game-music-volume";

const EFFECTS_LEVEL = 0.12;
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
  const stored = localStorage.getItem(key);
  // a key nobody has set yet means the default, not silence: Number(JSON.parse(null)) is 0
  if (stored === null) return fallback;
  try {
    const saved = Number(JSON.parse(stored));
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
  // lower and longer than chalk, one stroke of a pencil drawn along a ruler
  pencil: () => {
    scratch(1300, 0.16);
    scratch(700, 0.12);
  },
  box: () => {
    CUES.pencil();
    note(784, 0.12, 0.16, { type: "triangle" });
    note(1175, 0.2, 0.26, { type: "triangle" });
  },
  orb: () => note(740, 0, 0.09, { type: "triangle", level: 0.8 }),
  // a semitone higher each round, so a long cascade climbs as it spreads
  pop: (round = 0) => {
    const pitch = 523 * 2 ** (Math.min(round, 18) / 12);
    note(pitch, 0, 0.07, { type: "sine", level: 0.9 });
    note(pitch * 2, 0.01, 0.05, { type: "triangle", level: 0.35 });
  },
};

export const playGameSound = (name, ...details) => {
  if (!effectsVolume() || !CUES[name]) return;
  try {
    CUES[name](...details);
  } catch {
    // a browser without Web Audio simply plays the game in silence
  }
};

let music = null;

// a track sits under a conversation, so even a slider at the top stays background
const MUSIC_CEILING = 0.5;
// music that snaps on at full volume is a jolt, so it is always walked up and down
const FADE_MS = 1400;
const FADE_STEP_MS = 50;

const levelled = (level) => Math.min(1, Math.max(0, level)) * MUSIC_CEILING;

const fadeTo = (playing, target, done) => {
  clearInterval(playing.fade);
  const from = playing.element.volume;
  const steps = Math.round(FADE_MS / FADE_STEP_MS);
  let step = 0;
  playing.fade = setInterval(() => {
    step += 1;
    playing.element.volume = Math.min(1, Math.max(0, from + ((target - from) * step) / steps));
    if (step < steps) return;
    clearInterval(playing.fade);
    playing.fade = null;
    done?.();
  }, FADE_STEP_MS);
};

export const stopMusic = () => {
  if (!music) return;
  const playing = music;
  music = null;
  fadeTo(playing, 0, () => {
    playing.element.pause();
    // dropping the source lets the browser release the download straight away
    playing.element.removeAttribute("src");
    playing.element.load();
  });
};

export const setMusicLevel = (level) => {
  if (!music) return;
  // a hand on the slider wants the change now, so it cancels whatever fade was running
  clearInterval(music.fade);
  music.fade = null;
  music.element.volume = levelled(level);
};

// a level just chosen on the slider is passed in, because the slider's own write to storage may not have landed yet
export const startMusic = (source, chosen) => {
  const level = isAppSoundOn() ? chosen ?? musicVolume() : 0;
  if (music || !level || !source) return;
  try {
    const element = new Audio(source);
    element.loop = true;
    element.volume = 0;
    // a browser refuses this until the person has tapped something, which is not worth reporting
    element.play().catch(() => {});
    music = { element, fade: null };
    fadeTo(music, levelled(level));
  } catch {
    // no audio element means no music, which nobody needs telling about
  }
};
