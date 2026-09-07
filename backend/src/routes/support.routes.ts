import { Router } from 'express';
import { supportController } from '../controllers/support.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createTicketSchema, replyTicketSchema, createReportSchema } from '@yatrashare/shared';

const router = Router();

router.use(requireAuth);
router.post('/tickets', validateBody(createTicketSchema), supportController.createTicket);
router.get('/tickets', supportController.getMyTickets);
router.get('/tickets/:id', supportController.getTicketDetails);
router.post('/tickets/:id/reply', validateBody(replyTicketSchema), supportController.replyTicket);

router.post('/reports', validateBody(createReportSchema), supportController.createReport);
router.post('/block/:userId', supportController.blockUser);
router.delete('/block/:userId', supportController.unblockUser);

export default router;
