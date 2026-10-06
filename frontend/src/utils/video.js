// a video is sealed and uploaded as one file, which Cloudinary's free plan caps at 10 MB
const MAX_VIDEO_BYTES = 9.5 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 180;

// the bitrate aims a little under the limit, since an encoder only roughly keeps to the rate it is given
const SIZE_TARGET = 0.92;
const AUDIO_BITRATE = 64000;
const MIN_VIDEO_BITRATE = 300000;
const MAX_VIDEO_BITRATE = 2000000;
const SHARP_BITRATE = 1000000;
const HD_EDGE = 1280;
const SD_EDGE = 854;
const POSTER_EDGE = 320;
const POSTER_QUALITY = 0.6;

const PLAYABLE_AS_SENT = ["video/mp4", "video/webm"];

export class VideoRefusal extends Error {}

export const formatDuration = (seconds = 0) => {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const loadMediabunny = () => import("mediabunny");

const openVideo = async (file, { ALL_FORMATS, BlobSource, Input }) => {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const track = await input.getPrimaryVideoTrack().catch(() => null);
  if (!track) throw new VideoRefusal(`${file.name} isn't a video Whisprl can open`);
  return { input, track };
};

// encoders want even dimensions, so the size is rounded down to the nearest pair
const sizeWithin = (width, height, longEdge) => {
  const scale = Math.min(1, longEdge / Math.max(width, height));
  const even = (value) => Math.max(2, Math.floor((value * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
};

const bitrateFor = (duration) =>
  Math.floor(Math.min(MAX_VIDEO_BITRATE, (MAX_VIDEO_BYTES * SIZE_TARGET * 8) / duration - AUDIO_BITRATE));

const posterOf = async (track, { CanvasSink }) => {
  const size = sizeWithin(track.displayWidth, track.displayHeight, POSTER_EDGE);
  const frame = await new CanvasSink(track, { ...size, fit: "fill" }).getCanvas(await track.getFirstTimestamp());
  if (!frame) return undefined;
  const canvas = document.createElement("canvas");
  Object.assign(canvas, size);
  canvas.getContext("2d").drawImage(frame.canvas, 0, 0);
  return canvas.toDataURL("image/jpeg", POSTER_QUALITY);
};

// read when the video is chosen, so a video that is too long is refused before anything is sent
export const probeVideo = async (file) => {
  const mediabunny = await loadMediabunny();
  const { input, track } = await openVideo(file, mediabunny);
  const duration = await input.computeDuration();
  if (duration > MAX_VIDEO_SECONDS || bitrateFor(duration) < MIN_VIDEO_BITRATE) {
    throw new VideoRefusal(`Videos can be up to ${MAX_VIDEO_SECONDS / 60} minutes long`);
  }
  return { duration, width: track.displayWidth, height: track.displayHeight, preview: await posterOf(track, mediabunny) };
};

// a browser that cannot encode video can still send one that is already small and playable everywhere
const asSent = (file) => {
  if (file.size > MAX_VIDEO_BYTES || !PLAYABLE_AS_SENT.includes(file.type)) {
    throw new VideoRefusal("This browser can't shrink videos. Try a shorter one, or another browser.");
  }
  return { file };
};

// 720p when the size allows it and 480p when not, stopped as soon as the send is cancelled
export const compressVideo = async (file, { duration, onProgress, signal }) => {
  const mediabunny = await loadMediabunny();
  const { BufferTarget, Conversion, Mp4OutputFormat, Output, canEncodeAudio, canEncodeVideo } = mediabunny;
  const { input, track } = await openVideo(file, mediabunny);

  const bitrate = bitrateFor(duration);
  const size = sizeWithin(track.displayWidth, track.displayHeight, bitrate >= SHARP_BITRATE ? HD_EDGE : SD_EDGE);
  if (!(await canEncodeVideo("avc", { ...size, bitrate }))) return asSent(file);
  const audioCodec = (await canEncodeAudio("aac")) ? "aac" : "opus";

  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const conversion = await Conversion.init({
    input,
    output,
    video: { ...size, fit: "fill", codec: "avc", bitrate },
    audio: { codec: audioCodec, bitrate: AUDIO_BITRATE },
  });
  if (!conversion.isValid) return asSent(file);

  conversion.onProgress = onProgress;
  signal.throwIfAborted();
  signal.addEventListener("abort", () => conversion.cancel(), { once: true });
  await conversion.execute();
  signal.throwIfAborted();

  const shrunk = output.target.buffer;
  if (shrunk.byteLength > MAX_VIDEO_BYTES) throw new VideoRefusal("This video is too long to send");
  const name = file.name.replace(/\.[^.]+$/, "") + ".mp4";
  return { file: new File([shrunk], name, { type: "video/mp4" }), ...size };
};
