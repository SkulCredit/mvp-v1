import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import upload from '../middlewares/upload.middleware';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Document upload to Cloudinary
 */

/**
 * @swagger
 * /upload/document:
 *   post:
 *     summary: Upload a document (PDF, JPG, PNG — max 5MB)
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Document uploaded — returns Cloudinary URL
 *       400:
 *         description: No file provided or invalid format
 */
router.post('/document', upload.single('file'), uploadController.uploadDocument.bind(uploadController));

export default router;
