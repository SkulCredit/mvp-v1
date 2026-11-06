import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/response";
import ApiError from "../utils/apiError";
import storageService from "../storage/storage.service";
import { Document, Parent } from "../models/index";
import type { DocumentCreationAttributes } from "../models/Document";

class UploadController {
  async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) throw new ApiError(400, "No file uploaded");

      const userId: string | undefined = req.user?.userId;
      const isPhoto = req.file.mimetype.startsWith("image/");

   
      let parent: InstanceType<typeof Parent> | null = null;
      if (userId) {
        parent = await Parent.findOne({ where: { userId } });
      }

      let result;

      if (isPhoto && parent) {

        result = await storageService.uploadBuffer(
          req.file.buffer,
          req.file.originalname,
          "skulcredit_photos",
          {
            public_id: `skulcredit_photos/parent_${parent.id}`,
            overwrite: true,
          },
        );
      } else {
        result = await storageService.uploadBuffer(
          req.file.buffer,
          req.file.originalname,
          "skulcredit_documents",
        );
      }

      if (parent) {
        const existingPhoto = isPhoto
          ? await Document.findOne({
              where: { parentId: parent.id, category: "photo" },
            })
          : null;

        if (existingPhoto) {
          const currentPath = existingPhoto.filePath as string | null;
          if (currentPath) {
            await storageService.deleteFile(currentPath);
          }
          await existingPhoto.update({
            filePath: result.publicId,
            fileUrl: result.publicUrl,
          });
        } else {
          await Document.create({
            parentId: parent.id,
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
