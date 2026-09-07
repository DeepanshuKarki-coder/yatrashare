import { Router } from 'express';
import { messagingController } from '../controllers/messaging.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { sendMessageSchema } from '@yatrashare/shared';

const router = Router();

router.use(requireAuth);
router.get('/conversations', messagingController.getConversations);
router.get('/conversations/:conversationId/messages', messagingController.getMessages);
router.post('/messages', validateBody(sendMessageSchema), messagingController.sendMessage);
router.post('/conversations/:conversationId/read', messagingController.markRead);

export default router;
