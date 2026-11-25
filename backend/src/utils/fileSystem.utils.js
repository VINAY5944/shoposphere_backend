
import fs from "node:fs";
import path from "node:path";

// Create a directory if it does not exist.
export const ensureDirectoryExists = (directoryPath) => {
  const absolutePath = path.resolve(process.cwd(), directoryPath);

  fs.mkdirSync(absolutePath, { recursive: true });

  return absolutePath;
};

// Delete an uploaded file using its public URL path.
export const deleteUploadedFile = async (publicPath) => {
  if (!publicPath) return;

  const uploadsDirectory = path.resolve(process.cwd(), "uploads");

  // Convert /uploads/products/image.jpg to an absolute path.
  const relativePath = publicPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(process.cwd(), relativePath);

  // Prevent deleting files outside the uploads directory.
  const pathFromUploads = path.relative(
    uploadsDirectory,
    absolutePath
  );

  if (
    pathFromUploads.startsWith("..") ||
    path.isAbsolute(pathFromUploads)
  ) {
    throw new Error("Invalid upload file path");
  }

  try {
    await fs.promises.unlink(absolutePath);
  } catch (error) {
    // Ignore the error if the file was already deleted.
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};
