import { Router } from 'express';
import supportController from '../controllers/support.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';
import validate from '../middlewares/validate.middleware';
import {
  createTicketSchema,
  listTicketsSchema,
  ticketIdSchema,
  replyTicketSchema,
} from '../validators/support.validator';

const router = Router();

router.use(protect);
router.use(authorize('parent', 'school'));

router.post('/tickets',                   validate(createTicketSchema),  supportController.createTicket.bind(supportController));
router.get('/tickets',                    validate(listTicketsSchema),   supportController.listMyTickets.bind(supportController));
router.get('/tickets/:id',                validate(ticketIdSchema),      supportController.getMyTicket.bind(supportController));
router.post('/tickets/:id/messages',      validate(replyTicketSchema),   supportController.replyToTicket.bind(supportController));
router.delete('/tickets/:id',             validate(ticketIdSchema),      supportController.hideTicket.bind(supportController));

export default router;
