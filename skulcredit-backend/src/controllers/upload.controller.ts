import { Request, Response, NextFunction } from "express";
import path from "path";
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
      const relPath = path
        .relative(process.cwd(), req.file.path)
        .replace(/\\/g, "/");

      const publicUrl = `/${relPath}`;

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
