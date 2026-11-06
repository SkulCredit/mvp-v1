/**
 * Single entry point for all file uploads.
 * Delegates to the local disk storage backend. Swap this file to change
 * storage backends (e.g. S3, Cloudinary) without touching any calling service.
 */

import localStorageService from "../integrations/storage/storage.service";
import logger from "../config/logger";

export interface UploadResult {
  /** URL path — store as fileUrl / profilePhotoUrl */
  publicUrl: string;
  /** Relative file path — store as filePath for later deletion */
  publicId: string;
}

class StorageService {
  /**
   * Upload a file buffer to local disk and return its URL + relative path.
   *
   * @param buffer       Raw file bytes (from req.file.buffer)
   * @param originalName Original filename (used for extension detection)
   * @param folder       'skulcredit_documents' | 'skulcredit_photos'
   * @param options      Optional upload options (e.g. public_id, overwrite, mimetype)
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    folder: string = "skulcredit_documents",
    options: Record<string, unknown> = {},
  ): Promise<UploadResult> {
    const result = await localStorageService.uploadFile(buffer, folder, {
      ...options,
      originalname: originalName,
    });
    logger.info(
      `[StorageService] Uploaded ${originalName} → ${result.secure_url}`,
    );
    return { publicUrl: result.secure_url, publicId: result.public_id };
  }

  async uploadMulterFile(
    file: Express.Multer.File,
    folder: string = "skulcredit_documents",
  ): Promise<UploadResult> {
    return this.uploadBuffer(file.buffer, file.originalname, folder, {
      mimetype: file.mimetype,
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    await localStorageService.deleteFile(publicId);
    logger.info(`[StorageService] Deleted file: ${publicId}`);
  }
}

export default new StorageService();
