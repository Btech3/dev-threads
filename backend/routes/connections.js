// routes/connections.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getConnections,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  getPendingRequests,
  acceptRequest,
  rejectRequest
} from '../controllers/connectionController.js';

const router = express.Router();

router.get('/', verifyClerkToken, getConnections);
router.get('/followers', verifyClerkToken, getFollowers);
router.get('/following', verifyClerkToken, getFollowing);
router.post('/:userId/follow', verifyClerkToken, followUser);
router.post('/:userId/unfollow', verifyClerkToken, unfollowUser);
router.get('/pending', verifyClerkToken, getPendingRequests);
router.post('/:userId/accept', verifyClerkToken, acceptRequest);
router.post('/:userId/reject', verifyClerkToken, rejectRequest);

export default router;