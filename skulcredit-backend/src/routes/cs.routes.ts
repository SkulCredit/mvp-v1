import { Router } from "express";
import supportController from "../controllers/support.controller";
import adminController from "../controllers/admin.controller";
import uploadController from "../controllers/upload.controller";
import { protect } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/rbac.middleware";
import validate from "../middlewares/validate.middleware";
import upload, { uploadPhoto } from "../middlewares/upload.middleware";
import {
  listTicketsSchema,
  ticketIdSchema,
  csUpdateTicketSchema,
  csMessageSchema,
  escalateSchema,
} from "../validators/support.validator";

const router = Router();

router.use(protect);
router.use(
  authorize(
    "customer_service",
    "customer_service_manager",
    "risk_management",
    "accountant",
  ),
);

router.get("/dashboard", supportController.csDashboard.bind(supportController));
router.get(
  "/managers",
  supportController.csListManagers.bind(supportController),
);

router.get(
  "/tickets",
  validate(listTicketsSchema),
  supportController.csListTickets.bind(supportController),
);
router.get(
  "/tickets/:id",
  validate(ticketIdSchema),
  supportController.csGetTicket.bind(supportController),
);
router.patch(
  "/tickets/:id",
  validate(csUpdateTicketSchema),
  supportController.csUpdateTicket.bind(supportController),
);
router.post(
  "/tickets/:id/messages",
  validate(csMessageSchema),
  supportController.csAddMessage.bind(supportController),
);
router.post(
  "/tickets/:id/escalate",
  validate(escalateSchema),
  supportController.csEscalate.bind(supportController),
);
router.get(
  "/tickets/:id/audit",
  validate(ticketIdSchema),
  supportController.csTicketAudit.bind(supportController),
);

router.get("/profile", adminController.getAdminProfile.bind(adminController));
router.put(
  "/profile",
  adminController.updateAdminProfile.bind(adminController),
);
router.post(
  "/profile/avatar",
  uploadPhoto("cs").single("avatar"),
  uploadController.uploadDocument.bind(uploadController),
);
router.post(
  "/profile/change-password",
  adminController.updateAdminPassword.bind(adminController),
);

router.get("/parents", adminController.listParents.bind(adminController));
router.get("/schools", adminController.getSchools.bind(adminController));
router.get(
  "/applications",
  adminController.getLoanApplications.bind(adminController),
);

export default router;
