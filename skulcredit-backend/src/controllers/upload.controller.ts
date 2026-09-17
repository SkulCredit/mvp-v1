import { Request, Response, NextFunction } from "express";
import path from "path";
import env from "../config/env";
import { successResponse } from "../utils/response";
import ApiError from "../utils/apiError";

class UploadController {
  async uploadDocument(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.file) throw new ApiError(400, "No file uploaded");

      // req.file.path is the absolute disk path written by multer disk storage
      // Convert to a portable relative path for DB storage
      const relPath = path
        .relative(process.cwd(), req.file.path)
        .replace(/\\/g, "/");

      const publicUrl = `${env.appUrl.replace(/\/$/, "")}/${relPath}`;

      successResponse(res, 200, "File uploaded successfully", {
        url: publicUrl,
        filePath: relPath,
        filename: req.file.filename,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
