import { Request, Response, NextFunction } from 'express';
import storageService from '../integrations/storage/storage.service';
import { successResponse } from '../utils/response';
import ApiError from '../utils/apiError';

class UploadController {
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw new ApiError(400, 'No file uploaded');

      const result = await storageService.uploadFile(req.file.buffer, 'skulcredit_docs');
      successResponse(res, 200, 'File uploaded successfully', {
        url:       result.secure_url,
        publicId:  result.public_id,
        format:    result.format,
      });
    } catch (error) { next(error); }
  }
}

export default new UploadController();
