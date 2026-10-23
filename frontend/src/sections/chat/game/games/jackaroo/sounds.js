// Jackaroo's sounds: recorded cards, marbles, knocks and jingles from Kenney's CC0 packs, and a swish and a sparkle built in Web Audio.
import { playBuilt, playRecording, preloadRecordings } from "@/sections/chat/game/gameSounds";

const recording = (name) => `/games/jackaroo/sounds/${name}.mp3`;
// several takes of one sound, so it never repeats exactly
const takes = (name, count) => Array.from({ length: count }, (_, index) => recording(`${name}-${index + 1}`));
const RECORDED = {
  place: takes("card-place", 3),
  slide: takes("card-slide", 4),
  hop: takes("marble-hop", 5),
  hit: takes("marble-hit", 2),
  bin: takes("bin", 2),
  knock: takes("knock", 2),
  fan: recording("card-fan"),
  shove: recording("card-shove"),
  land: recording("marble-land"),
  stamp: recording("stamp"),
  won: recording("won"),
  lost: recording("lost"),
};

const anyOf = (list) => list[Math.floor(Math.random() * list.length)];
const slightly = () => 0.94 + Math.random() * 0.12;

const noiseOf = (ctx, seconds) => {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
  return buffer;
};

// air moving past: noise swept up and back down through a band, swelling and fading, carried from one side to the other
const whoosh = (ctx, output, { low, high, seconds, level, panFrom = 0, panTo = 0, delay = 0 }) => {
  const startsAt = ctx.currentTime + delay;
  const source = ctx.createBufferSource();
  const band = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();
  source.buffer = noiseOf(ctx, seconds);
  band.type = "bandpass";
  band.Q.value = 1.1;
  band.frequency.setValueAtTime(low, startsAt);
  band.frequency.exponentialRampToValueAtTime(high, startsAt + seconds * 0.45);
  band.frequency.exponentialRampToValueAtTime(low * 0.8, startsAt + seconds);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(level, startsAt + seconds * 0.45);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + seconds);
  pan.pan.setValueAtTime(panFrom, startsAt);
  pan.pan.linearRampToValueAtTime(panTo, startsAt + seconds);
  source.connect(band).connect(gain).connect(pan).connect(output);
  source.start(startsAt);
};

// glitter heard: small high bells scattered over a moment, each fading as it rings
const sparkle = (ctx, output) => {
  const bells = [1568, 1760, 2093, 2349, 2637, 3136, 3520];
  for (let bell = 0; bell < 9; bell += 1) {
    const startsAt = ctx.currentTime + bell * 0.055 + Math.random() * 0.03;
    const pitch = bells[Math.floor(Math.random() * bells.length)];
    [1, 2.76].forEach((partial, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = pitch * partial;
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(index ? 0.012 : 0.05, startsAt + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.5);
      oscillator.connect(gain).connect(output);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.52);
    });
  }
};

export const SOUNDS = {
  cardDown: () => playRecording(anyOf(RECORDED.place), { level: 0.7, rate: slightly() }),
  cardIn: (level = 0.45) => playRecording(anyOf(RECORDED.slide), { level, rate: slightly() }),
  fan: (level = 0.55) => playRecording(RECORDED.fan, { level }),
  // a card thrown away is shoved off and lands with a soft thud, as into a bin
  trash: () => {
    playRecording(RECORDED.shove, { level: 0.4, rate: 0.92 });
    playRecording(anyOf(RECORDED.bin), { level: 0.6, rate: 0.85, delay: 0.14 });
  },
  // two light knocks on the wood, as a player taps the table to say it is your go
  turn: () => {
    playRecording(RECORDED.knock[0], { level: 0.45 });
    playRecording(RECORDED.knock[1], { level: 0.38, rate: 1.12, delay: 0.13 });
  },
  stamp: () => playRecording(RECORDED.stamp, { level: 0.7 }),
  hop: (step) => playRecording(RECORDED.hop[step % RECORDED.hop.length], { level: 0.4, rate: slightly() }),
  land: () => playRecording(RECORDED.land, { level: 0.45 }),
  hit: () => playRecording(anyOf(RECORDED.hit), { level: 0.75 }),
  jump: () => playBuilt((ctx, output) => whoosh(ctx, output, { low: 380, high: 1900, seconds: 0.55, level: 0.5 })),
  // two marbles passing each other, one swish from each side
  swap: () =>
    playBuilt((ctx, output) => {
      whoosh(ctx, output, { low: 420, high: 2200, seconds: 0.6, level: 0.45, panFrom: -0.6, panTo: 0.6 });
      whoosh(ctx, output, { low: 340, high: 1700, seconds: 0.6, level: 0.35, panFrom: 0.6, panTo: -0.6, delay: 0.07 });
    }),
  home: () => playBuilt(sparkle),
  won: () => playRecording(RECORDED.won, { level: 0.7 }),
  lost: () => playRecording(RECORDED.lost, { level: 0.6 }),
};

export const preloadSounds = () => preloadRecordings(Object.values(RECORDED).flat());
