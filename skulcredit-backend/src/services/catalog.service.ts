/**
 * CatalogService
 *
 * Powers the three dependent-selection dropdowns on the parent eligibility form:
 *
 *   1. getInstitutionTypes()
 *      → all available institution types (Nursery, Primary, Secondary …)
 *
 *   2. getSchoolsByInstitutionType(institutionTypeId)
 *      → schools that offer at least one class for the chosen institution type
 *
 *   3. getClassLevels(schoolId, institutionTypeId)
 *      → class/level rows for the chosen (school × institution type) pair,
 *        grouped by sub_level_group (e.g. Junior / Senior Secondary)
 */

import { Op } from "sequelize";
import CatalogInstitutionType from "../models/CatalogInstitutionType";
import CatalogSchool from "../models/CatalogSchool";
import CatalogSchoolClassLevel from "../models/CatalogSchoolClassLevel";
import ApiError from "../utils/apiError";

// ── Shape types returned to the controller ────────────────────────────────────

export interface InstitutionTypeDTO {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SchoolDTO {
  id: string;
  name: string;
  isRegistered: boolean;
  tier: string | null;
  /** Percentage string for display, e.g. "12.5%" — null for non-registered */
  serviceChargeDisplay: string | null;
}

export interface ClassLevelGroup {
  /** null means the classes are not grouped (Nursery / Primary) */
  subLevelGroup: string | null;
  classes: { id: string; name: string; sortOrder: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────

class CatalogService {
  /**
   * Returns all institution types, ordered by sort_order ASC.
   * This list is static — no filter parameter needed.
   */
  async getInstitutionTypes(): Promise<InstitutionTypeDTO[]> {
    const types = await CatalogInstitutionType.findAll({
      order: [["sortOrder", "ASC"]],
      attributes: ["id", "name", "sortOrder"],
    });

    return types.map((t) => ({
      id: t.id,
      name: t.name,
      sortOrder: t.sortOrder,
    }));
  }

  /**
   * Returns every active school that offers classes for the given
   * institution type.  Uses a sub-query via the class-levels join so only
   * schools with real data appear.
   *
   * @param institutionTypeId  UUID of the selected institution type
   */
  async getSchoolsByInstitutionType(
    institutionTypeId: string,
  ): Promise<SchoolDTO[]> {
    // Validate the institution type exists first — gives the caller a clear 404
    const typeExists = await CatalogInstitutionType.findByPk(
      institutionTypeId,
      { attributes: ["id"] },
    );
    if (!typeExists) {
      throw new ApiError(404, "Institution type not found");
    }

    // Find school IDs that have at least one class for this institution type
    const classLevelRows = await CatalogSchoolClassLevel.findAll({
      where: { institutionTypeId },
      attributes: ["schoolId"],
      group: ["schoolId"],
    });

    const schoolIds = classLevelRows.map((r) => r.schoolId);

    if (schoolIds.length === 0) return [];

    const schools = await CatalogSchool.findAll({
      where: {
        id: { [Op.in]: schoolIds },
        isActive: true,
      },
      order: [["name", "ASC"]],
      attributes: ["id", "name", "isRegistered", "tier", "serviceChargeRate"],
    });

    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      isRegistered: s.isRegistered,
      tier: s.tier,
      serviceChargeDisplay: s.serviceChargeRate
        ? `${(Number(s.serviceChargeRate) * 100).toFixed(1)}%`
        : null,
    }));
  }

  /**
   * Returns the class/level list for a specific (school × institution type)
   * combination, grouped by sub_level_group for the UI.
   *
   * @param schoolId           UUID of the selected school
   * @param institutionTypeId  UUID of the selected institution type
   */
  async getClassLevels(
    schoolId: string,
    institutionTypeId: string,
  ): Promise<ClassLevelGroup[]> {
    // Validate school exists and is active
    const school = await CatalogSchool.findOne({
      where: { id: schoolId, isActive: true },
      attributes: ["id"],
    });
    if (!school) {
      throw new ApiError(404, "School not found");
    }

    // Validate institution type exists
    const typeExists = await CatalogInstitutionType.findByPk(
      institutionTypeId,
      { attributes: ["id"] },
    );
    if (!typeExists) {
      throw new ApiError(404, "Institution type not found");
    }

    const rows = await CatalogSchoolClassLevel.findAll({
      where: { schoolId, institutionTypeId },
      order: [
        ["subLevelGroup", "ASC"],
        ["sortOrder", "ASC"],
      ],
      attributes: ["id", "subLevelGroup", "className", "sortOrder"],
    });

    if (rows.length === 0) {
      throw new ApiError(
        404,
        "No class levels found for this school and institution type combination",
      );
    }

    // Group by subLevelGroup — preserve insertion order with a Map
    const groupMap = new Map<
      string,
      { id: string; name: string; sortOrder: number }[]
    >();

    for (const row of rows) {
      // Use empty string as key for null groups so Map works cleanly
      const key = row.subLevelGroup ?? "";
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push({
        id: row.id,
        name: row.className,
        sortOrder: row.sortOrder,
      });
    }

    // Convert back to the typed DTO — re-hydrate null for the empty-string key
    const result: ClassLevelGroup[] = [];
    for (const [key, classes] of groupMap.entries()) {
      result.push({
        subLevelGroup: key === "" ? null : key,
        classes,
      });
    }

    return result;
  }
}

export default new CatalogService();
