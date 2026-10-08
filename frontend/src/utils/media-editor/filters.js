const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

const saturation = (amount) => [
  0.213 + 0.787 * amount, 0.715 - 0.715 * amount, 0.072 - 0.072 * amount, 0, 0,
  0.213 - 0.213 * amount, 0.715 + 0.285 * amount, 0.072 - 0.072 * amount, 0, 0,
  0.213 - 0.213 * amount, 0.715 - 0.715 * amount, 0.072 + 0.928 * amount, 0, 0,
  0, 0, 0, 1, 0,
];

const contrast = (amount) => {
  const offset = (1 - amount) / 2;
  return [amount, 0, 0, 0, offset, 0, amount, 0, 0, offset, 0, 0, amount, 0, offset, 0, 0, 0, 1, 0];
};

const brightness = (lift) => [1, 0, 0, 0, lift, 0, 1, 0, 0, lift, 0, 0, 1, 0, lift, 0, 0, 0, 1, 0];

const channels = (red, green, blue) => [red, 0, 0, 0, 0, 0, green, 0, 0, 0, 0, 0, blue, 0, 0, 0, 0, 0, 1, 0];

const followedBy = (first, second) =>
  Array.from({ length: 20 }, (_, cell) => {
    const row = Math.floor(cell / 5);
    const column = cell % 5;
    const carried = [0, 1, 2, 3].reduce((sum, step) => sum + second[row * 5 + step] * first[step * 5 + column], 0);
    return column === 4 ? carried + second[row * 5 + 4] : carried;
  });

const filterOf = (...steps) => steps.reduce(followedBy, IDENTITY);

export const PHOTO_FILTERS = [
  { name: "Normal", matrix: null },
  { name: "Paris", matrix: filterOf(saturation(0.85), channels(1.04, 1, 1.03), brightness(0.04)) },
  { name: "Oslo", matrix: filterOf(saturation(0.7), contrast(0.9), channels(0.95, 1, 1.06), brightness(0.03)) },
  { name: "Lagos", matrix: filterOf(saturation(1.25), channels(1.08, 1.02, 0.88)) },
  { name: "Melbourne", matrix: filterOf(saturation(0.8), contrast(0.85), channels(1.04, 1.03, 0.9), brightness(0.04)) },
  { name: "Jakarta", matrix: filterOf(contrast(1.25), saturation(1.3)) },
  { name: "Abu Dhabi", matrix: filterOf(saturation(0.9), channels(1.08, 1.02, 0.92), brightness(0.06)) },
  { name: "Buenos Aires", matrix: filterOf(contrast(0.8), saturation(0.85), channels(1.05, 1, 0.95), brightness(0.06)) },
  { name: "New York", matrix: filterOf(contrast(1.15), saturation(0.9), channels(0.96, 1, 1.06)) },
  { name: "Jaipur", matrix: filterOf(saturation(1.2), channels(1.08, 0.96, 1.04)) },
  { name: "Cairo", matrix: filterOf(saturation(0.75), channels(1.1, 1.02, 0.85), contrast(0.92)) },
  { name: "Tokyo", matrix: filterOf(saturation(0), contrast(1.35)) },
  { name: "Rio de Janeiro", matrix: filterOf(saturation(1.35), channels(1.05, 1.03, 0.97), brightness(0.05)) },
];

export const filterNamed = (name) => PHOTO_FILTERS.find((filter) => filter.name === name) ?? PHOTO_FILTERS[0];

export const applyMatrix = (context, matrix) => {
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  const { data } = image;
  const rows = [0, 1, 2].map((channel) => matrix.slice(channel * 5, channel * 5 + 5));
  for (let pixel = 0; pixel < data.length; pixel += 4) {
    const red = data[pixel];
    const green = data[pixel + 1];
    const blue = data[pixel + 2];
    const alpha = data[pixel + 3];
    rows.forEach(([fromRed, fromGreen, fromBlue, fromAlpha, offset], channel) => {
      data[pixel + channel] = fromRed * red + fromGreen * green + fromBlue * blue + fromAlpha * alpha + offset * 255;
    });
  }
  context.putImageData(image, 0, 0);
};
