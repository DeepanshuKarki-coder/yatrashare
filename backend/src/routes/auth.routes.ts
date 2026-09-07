import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { registerSchema, loginSchema, updateProfileSchema } from '@yatrashare/shared';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), authController.updateProfile);

export default router;
