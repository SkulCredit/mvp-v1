/**
 * Local disk storage service.
 *
 * Saves uploaded files to the local filesystem under the configured uploads
 * directory (defaults to ./uploads).  Files are served statically by Express
 * via the /uploads route already wired in app.ts.
 *
 * Replaces the previous Cloudinary integration — no external dependencies.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import env from "../../config/env";
import logger from "../../config/logger";

/** Shape returned by uploadFile — matches the old Cloudinary response interface. */
export interface LocalUploadResult {
  secure_url: string; // URL path the frontend uses to fetch the file
  public_id: string; // relative file path stored for later deletion
}

const UPLOADS_DIR = path.resolve(process.cwd(), env.uploads.dir ?? "uploads");

/** Extract a safe file extension from the original filename or mimetype. */
function getExtension(originalName: string, mimetype: string): string {
  const fromName = path.extname(originalName);
  if (fromName) return fromName.toLowerCase();

  // Fall back to mimetype → extension map for common types
  const mimeMap: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "image/svg+xml": ".svg",
  };
  return mimeMap[mimetype] ?? "";
}

class LocalStorageService {
  /** Recursively ensure a directory exists. */
  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Save a file buffer to disk and return its URL + relative path.
   *
   * @param fileBuffer  Raw file bytes
   * @param folder       'skulcredit_documents' | 'skulcredit_photos'
   * @param options      Optional: { public_id, overwrite, originalname, mimetype }
   */
  async uploadFile(
    fileBuffer: Buffer,
    folder = "skulcredit_documents",
    options: Record<string, unknown> = {},
  ): Promise<LocalUploadResult> {
    const subfolder = folder === "skulcredit_photos" ? "photos" : "documents";
    const targetDir = path.join(UPLOADS_DIR, subfolder);
    this.ensureDir(targetDir);

    const originalName = (options.originalname as string) ?? "";
    const mimetype = (options.mimetype as string) ?? "";
    const ext = getExtension(originalName, mimetype);

    // ── Determine filename ──────────────────────────────────────────────────
    let filename: string;

    if (options.public_id) {
      // Deterministic filename (used for profile photos so re-uploads overwrite)
      // public_id comes in as e.g. "skulcredit_photos/parent_abc123"
      // → use the last segment as the filename.
      const baseName =
        String(options.public_id).split("/").pop() ?? randomUUID();
      filename = `${baseName}${ext}`;
    } else {
      filename = `${randomUUID()}${ext}`;
    }

    const fullPath = path.join(targetDir, filename);
    const relativePath = `uploads/${subfolder}/${filename}`;
    const urlPath = `/uploads/${subfolder}/${filename}`;

    // Write the file (overwrite if it already exists)
    fs.writeFileSync(fullPath, fileBuffer);

    logger.info(
      `[LocalStorage] Saved ${originalName || filename} → ${urlPath}`,
    );

    return {
      secure_url: urlPath,
      public_id: relativePath,
    };
  }

  /**
   * Delete a file from disk by its relative path (public_id).
   * Silently succeeds if the file doesn't exist.
   */
  async deleteFile(publicId: string): Promise<void> {
    // public_id is a relative path like "uploads/documents/abc123.jpg"
    // or a legacy Cloudinary public_id (which won't exist locally — just skip)
    const fullPath = path.resolve(process.cwd(), publicId);

    // Safety check: only delete files within the uploads directory
    const normalizedUploads = path.resolve(UPLOADS_DIR, "..");
    if (!fullPath.startsWith(normalizedUploads)) {
      logger.warn(
        `[LocalStorage] Refusing to delete file outside uploads dir: ${publicId}`,
      );
      return;
    }

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`[LocalStorage] Deleted ${publicId}`);
      } else {
        logger.warn(`[LocalStorage] File not found for deletion: ${publicId}`);
      }
    } catch (err) {
      logger.error(
        `[LocalStorage] Failed to delete ${publicId}: ${(err as Error).message}`,
      );
    }
  }
}

export default new LocalStorageService();
