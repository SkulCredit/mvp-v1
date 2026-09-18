import { Request, Response, NextFunction } from "express";
import catalogService from "../services/catalog.service";
import { successResponse } from "../utils/response";

class CatalogController {
  /**
   * GET /api/v1/catalog/institution-types
   *
   * Returns all institution types ordered by sort_order.
   * No auth required — this is public reference data.
   */
  async getInstitutionTypes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await catalogService.getInstitutionTypes();
      successResponse(res, 200, "Institution types retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/schools?institutionTypeId=<uuid>
   *
   * Returns active schools that offer the selected institution type.
   * Query param `institutionTypeId` is required.
   */
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

      const data = await catalogService.getSchoolsByInstitutionType(
        institutionTypeId,
      );
      successResponse(res, 200, "Schools retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/catalog/class-levels?schoolId=<uuid>&institutionTypeId=<uuid>
   *
   * Returns the class/level list for the chosen (school × institution type),
   * grouped by sub-level (e.g. Junior / Senior Secondary).
   * Both query params are required.
   */
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
