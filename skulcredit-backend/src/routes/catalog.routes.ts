import { Router } from "express";
import catalogController from "../controllers/catalog.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Catalog
 *   description: "School catalog — dependent selection data for the eligibility form"
 */

/**
 * @swagger
 * /catalog/institution-types:
 *   get:
 *     summary: List all institution types
 *     description: >
 *       Returns the full list of institution types (Nursery, Primary, Secondary,
 *       Tertiary / Sixth Form …) ordered for display.  No authentication required.
 *       This is the first dropdown on the parent eligibility form.
 *     tags: [Catalog]
 *     security: []
 *     responses:
 *       200:
 *         description: Institution types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:        { type: string, format: uuid }
 *                       name:      { type: string, example: "Nursery" }
 *                       sortOrder: { type: integer, example: 0 }
 */
router.get(
  "/institution-types",
  catalogController.getInstitutionTypes.bind(catalogController),
);

/**
 * @swagger
 * /catalog/schools:
 *   get:
 *     summary: List schools for a given institution type
 *     description: >
 *       Returns all active schools that offer classes for the selected
 *       institution type.  This is the second dropdown — it filters based
 *       on what the parent picked in the first dropdown.
 *     tags: [Catalog]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: institutionTypeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: UUID of the institution type selected in the first dropdown
 *     responses:
 *       200:
 *         description: Schools retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:                   { type: string, format: uuid }
 *                       name:                 { type: string, example: "Loral International Schools" }
 *                       isRegistered:         { type: boolean }
 *                       tier:                 { type: string, nullable: true, example: "1+" }
 *                       serviceChargeDisplay: { type: string, nullable: true, example: "10.0%" }
 *       400:
 *         description: Missing institutionTypeId query parameter
 *       404:
 *         description: Institution type not found
 */
router.get(
  "/schools",
  catalogController.getSchools.bind(catalogController),
);

/**
 * @swagger
 * /catalog/class-levels:
 *   get:
 *     summary: List class levels for a school and institution type
 *     description: >
 *       Returns the class/level list for the selected (school × institution type)
 *       combination, grouped by sub-level where applicable (e.g. Junior Secondary
 *       vs. Senior Secondary).  This is the third dropdown.
 *     tags: [Catalog]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: schoolId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: UUID of the school selected in the second dropdown
 *       - in: query
 *         name: institutionTypeId
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: UUID of the institution type selected in the first dropdown
 *     responses:
 *       200:
 *         description: Class levels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subLevelGroup:
 *                         type: string
 *                         nullable: true
 *                         example: "Junior Secondary"
 *                       classes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:        { type: string, format: uuid }
 *                             name:      { type: string, example: "JSS 1 (Basic 7)" }
 *                             sortOrder: { type: integer }
 *       400:
 *         description: Missing schoolId or institutionTypeId query parameter
 *       404:
 *         description: School or institution type not found
 */
router.get(
  "/class-levels",
  catalogController.getClassLevels.bind(catalogController),
);

export default router;
