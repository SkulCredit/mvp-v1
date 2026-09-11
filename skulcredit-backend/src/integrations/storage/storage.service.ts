import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import env from '../../config/env';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key:    env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

class StorageService {
  uploadFile(fileBuffer: Buffer, folder = 'skulcredit_documents'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
      });
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }
}

export default new StorageService();
