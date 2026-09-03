// routes/users.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserStats,
  getFollowers,
  getFollowing,
  getCurrentUser,
  getUserByClerkId,
  createUser,
  getUserSuggestions,
  updateCurrentUser
} from '../controllers/userController.js';

const router = express.Router();

// Authentication routes (require Clerk token)
router.get('/me', verifyClerkToken, getCurrentUser);
router.put('/me', verifyClerkToken, updateCurrentUser);
router.get('/suggestions', verifyClerkToken, getUserSuggestions);

// Public routes
router.get('/clerk/:clerkId', getUserByClerkId);
router.post('/', createUser);
router.get('/search', searchUsers);

// Profile routes
router.get('/:userId', getUserProfile);
router.put('/:userId', verifyClerkToken, updateUserProfile);
router.get('/:userId/stats', getUserStats);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export default router;