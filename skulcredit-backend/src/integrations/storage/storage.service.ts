import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import env from '../../config/env';
import logger from '../../config/logger';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key:    env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

class StorageService {
  constructor() {
    if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
      throw new Error(
        'Cloudinary credentials are not configured. ' +
        'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.',
      );
    }
  }

  uploadFile(
    fileBuffer: Buffer,
    folder = 'skulcredit_documents',
    options: Record<string, unknown> = {},
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, ...options },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary returned no upload result'));
          resolve(result);
        },
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  deleteFile(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        if (result?.result === 'not found') {
          // Treat missing files as a soft failure — log and resolve
          logger.warn(`[StorageService] Cloudinary asset not found for publicId: ${publicId}`);
          return resolve();
        }
        resolve();
      });
    });
  }
}

export default new StorageService();
