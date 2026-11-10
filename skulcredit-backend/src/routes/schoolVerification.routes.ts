import { Router } from "express";
import schoolVerificationController from "../controllers/schoolVerification.controller";

const router = Router();

router.get("/:token", schoolVerificationController.getByToken.bind(schoolVerificationController));
router.post("/:token", schoolVerificationController.useLink.bind(schoolVerificationController));

export default router;
