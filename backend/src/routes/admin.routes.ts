import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '@yatrashare/shared';

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPPORT]));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/journeys', adminController.listJourneys);
router.post('/journeys/:id/cancel', adminController.cancelJourney);
router.get('/payments', adminController.listPayments);
router.get('/reports', adminController.listReports);
router.patch('/reports/:id', adminController.updateReportStatus);
router.get('/tickets', adminController.listTickets);
router.patch('/tickets/:id/status', adminController.updateTicketStatus);
router.get('/audit-logs', adminController.listAuditLogs);

export default router;
