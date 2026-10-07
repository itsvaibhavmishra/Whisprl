export const MAX_VOICE_SECONDS = 15 * 60;
export const MIN_VOICE_SECONDS = 1;
export const WAVEFORM_BARS = 40;

const RECORDING_TYPES = ["audio/webm;codecs=opus", "audio/mp4"];
const VOICE_BITRATE = 32000;
const LEVEL_EVERY_MS = 100;
// speech rarely fills the scale, so its loudness is lifted to make the waveform readable
const LEVEL_GAIN = 4;

export class MicrophoneRefusal extends Error {}

const microphoneOf = async () => {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    throw new MicrophoneRefusal("This browser can't record voice messages");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (error) {
    throw new MicrophoneRefusal(
      error.name === "NotFoundError"
        ? "No microphone was found"
        : "Whisprl can't use your microphone. Allow it in your browser's site settings, then try again."
    );
  }
};

const loudnessOf = (analyser, samples) => {
  analyser.getByteTimeDomainData(samples);
  const power = samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) / samples.length;
  return Math.min(1, Math.sqrt(power) * LEVEL_GAIN);
};

// a browser saves its recording without a duration or a seek index, so it is copied into a complete file, its audio untouched
export const completeVoiceFile = async (recording) => {
  try {
    const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output, WebMOutputFormat } = await import("mediabunny");
    const input = new Input({ source: new BlobSource(recording), formats: ALL_FORMATS });
    const isOpus = (await input.getPrimaryAudioTrack())?.codec === "opus";
    const format = isOpus ? new WebMOutputFormat() : new Mp4OutputFormat({ fastStart: "in-memory" });
    const output = new Output({ format, target: new BufferTarget() });
    const conversion = await Conversion.init({ input, output });
    if (!conversion.isValid) return recording;
    await conversion.execute();
    return new Blob([output.target.buffer], { type: isOpus ? "audio/webm" : "audio/mp4" });
  } catch {
    return recording;
  }
};

export const waveformOf = (levels, bars = WAVEFORM_BARS) => {
  if (!levels.length) return Array(bars).fill(0);
  const peak = Math.max(...levels, 0.01);
  return Array.from({ length: bars }, (_, bar) => {
    const slice = levels.slice(Math.floor((bar * levels.length) / bars), Math.ceil(((bar + 1) * levels.length) / bars));
    return Math.round((Math.max(...slice, 0) / peak) * 100);
  });
};

const recordFrom = (stream, onLevels) => {
  const mimeType = RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, { ...(mimeType && { mimeType }), audioBitsPerSecond: VOICE_BITRATE });
  const chunks = [];
  recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
  recorder.start();

  const startedAt = performance.now();
  const secondsSoFar = () => (performance.now() - startedAt) / 1000;
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const levels = [];
  const sampler = setInterval(() => {
    levels.push(loudnessOf(analyser, samples));
    onLevels(levels, secondsSoFar());
  }, LEVEL_EVERY_MS);

  const release = () => {
    clearInterval(sampler);
    stream.getTracks().forEach((track) => track.stop());
    context.close().catch(() => {});
  };

  const stopped = () =>
    new Promise((resolve) => {
      if (recorder.state === "inactive") return resolve();
      recorder.onstop = resolve;
      recorder.stop();
    });

  return {
    finish: async () => {
      const duration = secondsSoFar();
      await stopped();
      release();
      return { file: new Blob(chunks, { type: recorder.mimeType }), duration, waveform: waveformOf(levels) };
    },
    cancel: async () => {
      await stopped();
      release();
    },
  };
};

export const startVoiceRecording = async ({ onLevels }) => {
  const stream = await microphoneOf();
  try {
    return recordFrom(stream, onLevels);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }
};
