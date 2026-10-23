import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "cloudinary";

process.loadEnvFile();

// the pictures an email points at, kept in the repo and pushed up under one stable name each
const FOLDER = "email-media";
const MEDIA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "templates", "mail", "media");

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// a fixed public_id keeps the address the same, so a template never has to be edited to pick up a new picture
const push = async (file) => {
  const name = path.parse(file).name;
  const { secure_url } = await cloudinary.v2.uploader.upload(path.join(MEDIA, file), {
    folder: FOLDER,
    public_id: name,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });
  return { name, url: secure_url.replace(/\/upload\/v\d+\//, "/upload/") };
};

const run = async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error("Cloudinary is not configured in backend/.env");
  const files = fs.readdirSync(MEDIA).filter((file) => /\.(jpg|png)$/i.test(file));
  if (!files.length) throw new Error(`No pictures in ${MEDIA}`);

  for (const file of files) {
    const { name, url } = await push(file);
    console.log(`${name.padEnd(10)} ${url}`);
  }
  console.log("\nThese addresses do not change, so re-running this replaces the picture in place.");
};

run().catch((error) => {
  console.error(`Stopped: ${error.message}`);
  process.exitCode = 1;
});
