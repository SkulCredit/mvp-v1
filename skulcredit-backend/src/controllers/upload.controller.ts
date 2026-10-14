import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import ApiError from "../utils/apiError";
import storageService from "../storage/storage.service";
import { Document } from "../models/index";
import type { DocumentCreationAttributes } from "../models/Document";

class UploadController {
  async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) throw new ApiError(400, "No file uploaded");

      // req.user is typed in src/types/express.d.ts — no cast needed
      const userId: string | undefined = req.user?.userId;
      const isPhoto = req.file.mimetype.startsWith("image/");

      let result;

      if (isPhoto && userId) {
        // Profile photo — deterministic public_id so Cloudinary overwrites the old image
        result = await storageService.uploadBuffer(
          req.file.buffer,
          req.file.originalname,
          'skulcredit_photos',
          { public_id: `skulcredit_photos/parent_${userId}`, overwrite: true },
        );
      } else {
        result = await storageService.uploadBuffer(
          req.file.buffer,
          req.file.originalname,
          'skulcredit_documents',
        );
      }

      // Persist to Document table so the file is trackable / deletable later
      if (userId) {
        const existingPhoto = isPhoto
          ? await Document.findOne({
              where: { parentId: userId, category: "photo" },
            })
          : null;

        if (existingPhoto) {
          // Guard against pre-migration rows that hold a local path.
          // Cloudinary public_ids never start with 'uploads/', so skip deletion for legacy records.
          const currentPath = existingPhoto.filePath as string | null;
          if (currentPath && !currentPath.startsWith('uploads/') && !currentPath.startsWith('/uploads/')) {
            await storageService.deleteFile(currentPath);
          }
          await existingPhoto.update({
            filePath: result.publicId,
            fileUrl: result.publicUrl,
          });
        } else {
          await Document.create({
            parentId: userId,
            category: isPhoto ? "photo" : "kyc_document",
            filePath: result.publicId,
            fileUrl: result.publicUrl,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
          } as DocumentCreationAttributes);
        }
      }

      successResponse(res, 200, "File uploaded successfully", {
        url: result.publicUrl,
        publicId: result.publicId,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
