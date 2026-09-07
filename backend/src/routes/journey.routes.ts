import { Router } from 'express';
import { journeyController } from '../controllers/journey.controller';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validation.middleware';
import { createJourneySchema, searchJourneySchema, UserRole } from '@yatrashare/shared';

const router = Router();

router.get('/search', validateQuery(searchJourneySchema), journeyController.search);
router.get('/my-journeys', requireAuth, journeyController.getDriverJourneys);
router.get('/:id', optionalAuth, journeyController.getDetails);
router.post(
  '/',
  requireAuth,
  requireRole([UserRole.DRIVER, UserRole.ADMIN]),
  validateBody(createJourneySchema),
  journeyController.create
);
router.patch('/:id/status', requireAuth, journeyController.updateStatus);

export default router;
