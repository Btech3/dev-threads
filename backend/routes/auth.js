import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  handleClerkWebhook,
  logout,
  checkAuth
} from '../controllers/authController.js';

const router = express.Router();

// Clerk webhook for user sync
router.post('/webhook', handleClerkWebhook);

// Check authentication status
router.get('/check', verifyClerkToken, checkAuth);

// Logout
router.post('/logout', logout);

export default router; 