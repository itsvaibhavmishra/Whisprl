import { useCallback, useEffect, useRef, useState } from "react";

const CLIPS = import.meta.glob("/src/sections/tour/voice/*.m4a", { eager: true, query: "?url", import: "default" });

const clipOf = (stepId) => CLIPS[`/src/sections/tour/voice/${stepId}.m4a`];

const QUIET = { duration: null, isBlocked: false };
const SAMPLES = 512;

let listening = null;

// one audio context for the whole tour, which a browser keeps paused until the first tap
const listeningContext = () => {
  listening ??= new AudioContext();
  return listening;
};

// measured only once the context runs, since a voice routed through a paused one would play silently
const analyserFor = async (audio) => {
  const context = listeningContext();
  await context.resume().catch(() => {});
  if (context.state !== "running") return null;
  const analyser = context.createAnalyser();
  analyser.fftSize = SAMPLES;
  const source = context.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(context.destination);
  return { analyser, disconnect: () => source.disconnect() };
};

const loudnessOf = (analyser, samples) => {
  analyser.getByteTimeDomainData(samples);
  const power = samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) / samples.length;
  return Math.min(1, Math.sqrt(power) * 4);
};

// a browser plays no sound before the first tap, so a refused start waits for the speaker button rather than failing
const useTourVoice = (stepId, isMuted) => {
  const clip = clipOf(stepId);
  const [voice, setVoice] = useState(QUIET);
  const [attempt, setAttempt] = useState(0);
  const listener = useRef(null);
  const samples = useRef(new Uint8Array(SAMPLES));

  useEffect(() => {
    if (!clip || isMuted) return undefined;
    const audio = new Audio(clip);
    let isCurrent = true;
    const update = (change) => setVoice((previous) => ({ ...previous, ...change }));
    audio.addEventListener("loadedmetadata", () => update({ duration: audio.duration }));
    audio.addEventListener("playing", () => update({ isBlocked: false }));
    analyserFor(audio)
      .catch(() => null)
      .then((found) => {
        if (!isCurrent) return found?.disconnect();
        listener.current = found;
        return audio.play().catch(() => update({ isBlocked: true }));
      });
    return () => {
      isCurrent = false;
      audio.pause();
      listener.current?.disconnect();
      listener.current = null;
      setVoice(QUIET);
    };
  }, [clip, isMuted, attempt]);

  const readLevel = useCallback(() => (listener.current ? loudnessOf(listener.current.analyser, samples.current) : 0), []);

  return {
    ...(clip && !isMuted ? voice : QUIET),
    hasClip: Boolean(clip),
    readLevel,
    playAgain: () => setAttempt((count) => count + 1),
  };
};

export default useTourVoice;
