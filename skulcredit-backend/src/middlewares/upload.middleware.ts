import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
  "application/vnd.ms-excel",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file format. Please upload JPEG, PNG, PDF, DOCX, or CSV.",
      ),
    );
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export default upload;

/**
 * Factory that returns a multer instance for profile photos (JPEG, PNG, WebP).
 * Files are held in memory — no disk write occurs.
 */
export function uploadPhoto(_role: "parent" | "cs" | "admin" | "school") {
  const photoFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ): void => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, or WebP images are allowed for profile photos."));
    }
  };

  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: photoFilter,
  });
}
