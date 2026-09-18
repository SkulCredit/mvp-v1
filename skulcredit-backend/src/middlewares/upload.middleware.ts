import multer, { FileFilterCallback, StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import env from "../config/env";

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

/**
 * Disk storage engine — writes to <UPLOADS_DIR>/documents/<uuid>-<name>.<ext>
 * The `destination` sub-folder can be overridden per-route by setting
 * `req.uploadFolder` before the middleware runs.
 */
const diskStorage: StorageEngine = multer.diskStorage({
  destination(_req, _file, cb) {
    const folder = path.resolve(process.cwd(), env.uploads.dir, "documents");
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    cb(null, `${uuidv4()}-${safeName}${ext}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

export default upload;
