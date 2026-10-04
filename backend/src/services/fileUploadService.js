import cloudinary from "cloudinary";
import streamifier from "streamifier";
import createHttpError from "http-errors";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (mainFolder, file, subFolder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: `${mainFolder}/${subFolder}`,
        public_id: file.originalname,
      },
      (error, result) => {
        if (error) {
          reject(
            createHttpError.InternalServerError(
              "Error uploading file to Cloudinary"
            )
          );
        } else {
          resolve(result.secure_url);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const uploadFiles = async (mainFolder, files, subFolder) => {
  try {
    // Ensure files is an array
    const filesArray = Array.isArray(files) ? files : [files];

    // Upload each file to Cloudinary
    const uploadPromises = filesArray.map((file) =>
      uploadToCloudinary(mainFolder, file, subFolder)
    );

    const fileUrls = await Promise.all(uploadPromises);

    return {
      status: "success",
      message: "Files uploaded successfully",
      fileUrls,
    };
  } catch (error) {
    throw error;
  }
};

// Cloudinary names a file by the path after "/upload/", minus the version and the extension.
const publicIdFromUrl = (fileUrl) => {
  const [, path] = fileUrl.split("/upload/");
  return decodeURIComponent(path.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, ""));
};

export const isCloudinaryFile = (fileUrl) =>
  typeof fileUrl === "string" && fileUrl.includes("res.cloudinary.com") && fileUrl.includes("/upload/");

export const deleteFile = async (fileUrl) => {
  const publicId = publicIdFromUrl(fileUrl);
  const { result } = await cloudinary.v2.uploader.destroy(publicId);
  if (result !== "ok") return;

  const folder = publicId.slice(0, publicId.lastIndexOf("/"));
  const { resources } = await cloudinary.v2.api.resources({ type: "upload", prefix: `${folder}/` });
  if (resources.length === 0) {
    await cloudinary.v2.api.delete_folder(folder);
  }
};
