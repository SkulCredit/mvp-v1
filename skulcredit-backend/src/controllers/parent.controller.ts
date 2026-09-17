import { Request, Response, NextFunction } from "express";
import parentService from "../services/parent.service";
import { successResponse } from "../utils/response";
import ApiError from "../utils/apiError";

class ParentController {
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Profile fetched successfully",
        await parentService.getProfile(req.user!.userId),
      );
    } catch (error) {
      next(error);
    }
  }

  async completeProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Profile updated successfully",
        await parentService.completeProfile(req.user!.userId, req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await parentService.changePassword(req.user!.userId, req.body);
      successResponse(res, 200, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  }

  async verifyKYC(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "KYC verified successfully",
        await parentService.verifyKYC(req.user!.userId, req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyNin(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { nin } = req.body as { nin: string };
      successResponse(
        res,
        200,
        "NIN verified successfully",
        await parentService.verifyNin(nin),
      );
    } catch (error) {
      next(error);
    }
  }

  async addStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "Student added successfully",
        await parentService.addStudent(req.user!.userId, req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async getStudents(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Students fetched successfully",
        await parentService.getStudents(req.user!.userId),
      );
    } catch (error) {
      next(error);
    }
  }

  async getStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Student fetched successfully",
        await parentService.getStudent(req.user!.userId, String(req.params.id)),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Student updated successfully",
        await parentService.updateStudent(
          req.user!.userId,
          String(req.params.id),
          req.body,
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await parentService.deleteStudent(
        req.user!.userId,
        String(req.params.id),
      );
      successResponse(res, 200, "Student deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async getApplications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Applications fetched successfully",
        await parentService.getApplications(req.user!.userId),
      );
    } catch (error) {
      next(error);
    }
  }

  async getApplication(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Application fetched successfully",
        await parentService.getApplication(
          req.user!.userId,
          String(req.params.id),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getSchoolDirectory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Schools fetched successfully",
        await parentService.getSchoolDirectory(req.query),
      );
    } catch (error) {
      next(error);
    }
  }

  async requestSchool(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        201,
        "School request submitted successfully",
        await parentService.requestSchool(req.user!.userId, req.body),
      );
    } catch (error) {
      next(error);
    }
  }

  async getSchoolRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "School requests fetched successfully",
        await parentService.getSchoolRequests(req.user!.userId),
      );
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Dashboard data fetched successfully",
        await parentService.getDashboard(req.user!.userId),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { profilePhotoUrl } = req.body as { profilePhotoUrl: string };
      successResponse(
        res,
        200,
        "Profile photo updated successfully",
        await parentService.completeProfile(req.user!.userId, {
          profilePhotoUrl,
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  async submitApplication(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const files = req.files as
        | Record<string, Express.Multer.File[]>
        | undefined;

      // photo is uploaded under field name "photo" (single file)
      const photoFile = files?.["photo"]?.[0];

      // KYC documents uploaded under field name "kycDocs" (multiple files)
      // docTypes is a parallel JSON array sent in body: ["Bank Statement", ...]
      const rawDocTypes: string[] = Array.isArray(req.body.docTypes)
        ? req.body.docTypes
        : req.body.docTypes
          ? JSON.parse(req.body.docTypes as string)
          : [];

      const kycFiles = (files?.["kycDocs"] ?? []).map((f, i) => ({
        ...f,
        docType: rawDocTypes[i] ?? "KYC Document",
        lendsqrTypeId: 1,
        lendsqrSubTypeId: undefined as number | undefined,
      }));

      if (!photoFile) throw new ApiError(400, "Profile photo is required");
      if (kycFiles.length === 0)
        throw new ApiError(400, "At least one KYC document is required");

      const result = await parentService.submitApplication(req.user!.userId, {
        ...req.body,
        tuitionAmount: parseFloat(req.body.tuitionAmount as string),
        tenor: parseInt(req.body.tenor as string, 10),
        students:
          typeof req.body.students === "string"
            ? JSON.parse(req.body.students as string)
            : req.body.students,
        termsConfirmed:
          req.body.termsConfirmed === "true" ||
          req.body.termsConfirmed === true,
        photo: photoFile,
        kycDocuments: kycFiles,
      });

      successResponse(res, 201, "Application submitted successfully", result);
    } catch (error) {
      next(error);
    }
  }

  async deleteProfilePhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      successResponse(
        res,
        200,
        "Profile photo removed successfully",
        await parentService.completeProfile(req.user!.userId, {
          profilePhotoUrl: null,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ParentController();
