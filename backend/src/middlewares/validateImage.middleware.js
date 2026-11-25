
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import { deleteUploadedFile } from "../utils/fileSystem.utils.js";

const allowedImageTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const validateImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Inspect the actual file contents.
    const detectedType = await fileTypeFromFile(req.file.path);

    if (!detectedType) {
      throw new Error("Unable to identify image file");
    }

    const allowedExtensions =
      allowedImageTypes[detectedType.mime];

    const actualExtension = path
      .extname(req.file.originalname)
      .toLowerCase();

    if (
      !allowedExtensions ||
      !allowedExtensions.includes(actualExtension)
    ) {
      throw new Error(
        "Invalid image. Only JPEG, PNG and WebP are allowed."
      );
    }

    // Continue only when actual contents and extension match.
    return next();
  } catch (error) {
    // Remove invalid uploaded file.
    try {
      await deleteUploadedFile(
        `/uploads/products/${req.file.filename}`
      );
    } catch (cleanupError) {
      console.error(
        "Invalid image cleanup failed:",
        cleanupError.message
      );
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid image file",
    });
  }
};

export default validateImage;
