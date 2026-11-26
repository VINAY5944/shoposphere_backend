
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

import { ensureDirectoryExists } from "../utils/fileSystem.utils.js";

// Create uploads/products directory.
const uploadDirectory = ensureDirectoryExists("uploads/products");

// Configure disk storage.
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = `${crypto.randomUUID()}${extension}`;

    callback(null, uniqueName);
  },
});

// Allow only supported image formats.
const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new Error("Only JPEG, PNG and WebP images are allowed")
    );
  }

  callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

export default upload;
