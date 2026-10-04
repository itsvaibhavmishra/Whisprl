const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = url;
  });

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const rotatedBounds = (width, height, radians) => ({
  width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
  height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
});

const cropImage = async (imageUrl, crop, rotation, maxWidth) => {
  const image = await loadImage(imageUrl);
  const radians = toRadians(rotation);
  const bounds = rotatedBounds(image.width, image.height, radians);

  const rotated = document.createElement("canvas");
  rotated.width = bounds.width;
  rotated.height = bounds.height;
  const rotatedContext = rotated.getContext("2d");
  rotatedContext.translate(bounds.width / 2, bounds.height / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

  const width = Math.min(crop.width, maxWidth);
  const height = Math.round((width * crop.height) / crop.width);
  const cropped = document.createElement("canvas");
  cropped.width = width;
  cropped.height = height;
  cropped
    .getContext("2d")
    .drawImage(rotated, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);

  return new Promise((resolve) =>
    cropped.toBlob((blob) => resolve(URL.createObjectURL(blob)), "image/jpeg", 0.9)
  );
};

export default cropImage;
