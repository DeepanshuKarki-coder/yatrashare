import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createReviewSchema } from '@yatrashare/shared';

const router = Router();

router.get('/user/:userId', reviewController.getUserReviews);
router.post('/', requireAuth, validateBody(createReviewSchema), reviewController.createReview);

export default router;
