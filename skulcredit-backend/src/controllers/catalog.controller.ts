import { Request, Response, NextFunction } from "express";
import catalogService from "../services/catalog.service";
import schoolTermService from "../services/schoolTerm.service";
import { successResponse } from "../utils/response";

class CatalogController {
  async getSessions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sessions = await schoolTermService.listSessionNames();
      successResponse(res, 200, "Sessions fetched", sessions);
    } catch (error) {
      next(error);
    }
  }

  async getTermsBySession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const sessionName = decodeURIComponent(String(req.params.sessionName));
      const terms = await schoolTermService.getTermsBySessionName(sessionName);
      if (terms.length === 0) {
        res.status(404).json({ success: false, message: `No terms found for session "${sessionName}"` });
        return;
      }
      successResponse(res, 200, "Terms fetched", terms);
    } catch (error) {
      next(error);
    }
  }

  async getInstitutionTypes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await catalogService.getInstitutionTypes();
      successResponse(
        res,
        200,
        "Institution types retrieved successfully",
        data,
      );
    } catch (error) {
      next(error);
    }
  }

  async getSchools(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { institutionTypeId } = req.query as { institutionTypeId?: string };

      if (!institutionTypeId) {
        res.status(400).json({
          success: false,
          message: "Query parameter 'institutionTypeId' is required",
        });
        return;
      }

      const data =
        await catalogService.getSchoolsByInstitutionType(institutionTypeId);
      successResponse(res, 200, "Schools retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  async getSchoolById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const data = await catalogService.getSchoolById(id);
      successResponse(res, 200, "School retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  async getClassLevels(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { schoolId, institutionTypeId } = req.query as {
        schoolId?: string;
        institutionTypeId?: string;
      };

      if (!schoolId || !institutionTypeId) {
        res.status(400).json({
          success: false,
          message:
            "Query parameters 'schoolId' and 'institutionTypeId' are both required",
        });
        return;
      }

      const data = await catalogService.getClassLevels(
        schoolId,
        institutionTypeId,
      );
      successResponse(res, 200, "Class levels retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }
}

export default new CatalogController();
