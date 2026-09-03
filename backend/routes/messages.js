// routes/messages.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/', verifyClerkToken, getConversations);
router.get('/:userId', verifyClerkToken, getMessages);
router.post('/', verifyClerkToken, sendMessage);
router.put('/:messageId/read', verifyClerkToken, markAsRead);
router.delete('/:messageId', verifyClerkToken, deleteMessage);

export default router;