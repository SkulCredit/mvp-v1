import { Op } from "sequelize";
import CatalogInstitutionType from "../models/CatalogInstitutionType";
import CatalogSchool from "../models/CatalogSchool";
import CatalogSchoolClassLevel from "../models/CatalogSchoolClassLevel";
import ApiError from "../utils/apiError";

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
  serviceChargeRate: number | null;
  serviceChargeDisplay: string | null;
}

export interface SchoolDetailDTO extends SchoolDTO {
  // same as SchoolDTO, exposed separately for the /catalog/schools/:id endpoint
}

export interface ClassLevelGroup {
  subLevelGroup: string | null;
  classes: { id: string; name: string; sortOrder: number }[];
}

class CatalogService {
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
   * @param institutionTypeId
   */
  async getSchoolsByInstitutionType(
    institutionTypeId: string,
  ): Promise<SchoolDTO[]> {
    const typeExists = await CatalogInstitutionType.findByPk(
      institutionTypeId,
      { attributes: ["id"] },
    );
    if (!typeExists) {
      throw new ApiError(404, "Institution type not found");
    }

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
      serviceChargeRate: s.serviceChargeRate
        ? Number(s.serviceChargeRate)
        : null,
      serviceChargeDisplay: s.serviceChargeRate
        ? `${(Number(s.serviceChargeRate) * 100).toFixed(1)}%`
        : null,
    }));
  }

  /**
   * @param schoolId           UUID of the selected school
   * @param institutionTypeId  UUID of the selected institution type
   */
  async getClassLevels(
    schoolId: string,
    institutionTypeId: string,
  ): Promise<ClassLevelGroup[]> {
    const school = await CatalogSchool.findOne({
      where: { id: schoolId, isActive: true },
      attributes: ["id"],
    });
    if (!school) {
      throw new ApiError(404, "School not found");
    }

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

    const groupMap = new Map<
      string,
      { id: string; name: string; sortOrder: number }[]
    >();

    for (const row of rows) {
      const key = row.subLevelGroup ?? "";
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push({
        id: row.id,
        name: row.className,
        sortOrder: row.sortOrder,
      });
    }

    const result: ClassLevelGroup[] = [];
    for (const [key, classes] of groupMap.entries()) {
      result.push({
        subLevelGroup: key === "" ? null : key,
        classes,
      });
    }

    return result;
  }

  async getSchoolById(schoolId: string): Promise<SchoolDetailDTO> {
    const school = await CatalogSchool.findOne({
      where: { id: schoolId, isActive: true },
      attributes: ["id", "name", "isRegistered", "tier", "serviceChargeRate"],
    });

    if (!school) throw new ApiError(404, "School not found");

    return {
      id: school.id,
      name: school.name,
      isRegistered: school.isRegistered,
      tier: school.tier,
      serviceChargeRate: school.serviceChargeRate
        ? Number(school.serviceChargeRate)
        : null,
      serviceChargeDisplay: school.serviceChargeRate
        ? `${(Number(school.serviceChargeRate) * 100).toFixed(1)}%`
        : null,
    };
  }
}

export default new CatalogService();
