import cloudinary from "cloudinary";
import crypto from "crypto";
import streamifier from "streamifier";
import createHttpError from "http-errors";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// documents go up as raw files with no extension, since a free account refuses to serve anything named .pdf or .zip
const storageOf = (file) => ({
  resource_type: file.mimetype.startsWith("image/") ? "image" : "raw",
  public_id: crypto.randomUUID(),
});

export const uploadFile = (folder, file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream({ folder, ...storageOf(file) }, (error, result) =>
      error ? reject(createHttpError.InternalServerError("Error uploading file to Cloudinary")) : resolve(result.secure_url)
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });

// Cloudinary names a file by the path after "/upload/", minus the version, and minus the extension for an image.
const storedFileOf = (fileUrl) => {
  const [prefix, storedPath] = fileUrl.split("/upload/");
  const resource_type = prefix.endsWith("/raw") ? "raw" : "image";
  const withoutVersion = decodeURIComponent(storedPath.replace(/^v\d+\//, ""));
  return { resource_type, publicId: resource_type === "raw" ? withoutVersion : withoutVersion.replace(/\.[^/.]+$/, "") };
};

export const isCloudinaryFile = (fileUrl) =>
  typeof fileUrl === "string" && fileUrl.includes("res.cloudinary.com") && fileUrl.includes("/upload/");

export const deleteFile = async (fileUrl) => {
  const { resource_type, publicId } = storedFileOf(fileUrl);
  const { result } = await cloudinary.v2.uploader.destroy(publicId, { resource_type, invalidate: true });
  if (result !== "ok") return;

  const folder = publicId.slice(0, publicId.lastIndexOf("/"));
  const { resources } = await cloudinary.v2.api.resources({ type: "upload", prefix: `${folder}/`, resource_type });
  if (resources.length === 0) {
    await cloudinary.v2.api.delete_folder(folder).catch(() => {});
  }
};
