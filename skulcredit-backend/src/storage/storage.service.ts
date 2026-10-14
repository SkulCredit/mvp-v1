/**
 * Single entry point for all file uploads.
 * Delegates to Cloudinary. Swap this file to change storage backends
 * without touching any calling service.
 */

import cloudinaryStorageService from '../integrations/storage/storage.service';
import logger from '../config/logger';

export interface UploadResult {
  /** Cloudinary CDN URL — store as fileUrl / profilePhotoUrl */
  publicUrl: string;
  /** Cloudinary public_id — store as filePath for later deletion */
  publicId: string;
}

class StorageService {
  /**
   * Upload a file buffer to Cloudinary and return its CDN URL + public_id.
   *
   * @param buffer       Raw file bytes (from req.file.buffer)
   * @param originalName Original filename (unused by Cloudinary, kept for logging)
   * @param folder       Cloudinary folder: 'skulcredit_documents' | 'skulcredit_photos'
   * @param options      Optional Cloudinary upload options (e.g. public_id, overwrite)
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    folder: string = 'skulcredit_documents',
    options: Record<string, unknown> = {},
  ): Promise<UploadResult> {
    const result = await cloudinaryStorageService.uploadFile(buffer, folder, options);
    logger.info(`[StorageService] Uploaded ${originalName} → ${result.secure_url}`);
    return { publicUrl: result.secure_url, publicId: result.public_id };
  }

  async uploadMulterFile(
    file: Express.Multer.File,
    folder: string = 'skulcredit_documents',
  ): Promise<UploadResult> {
    return this.uploadBuffer(file.buffer, file.originalname, folder);
  }

  async deleteFile(publicId: string): Promise<void> {
    await cloudinaryStorageService.deleteFile(publicId);
    logger.info(`[StorageService] Deleted Cloudinary asset: ${publicId}`);
  }
}

export default new StorageService();
