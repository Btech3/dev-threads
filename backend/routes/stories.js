import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getActiveStories,
  createStory,
  getUserStories,
  deleteStory
} from '../controllers/storyController.js';

const router = express.Router();

// Get all active stories from followed users
router.get('/', getActiveStories);

// Get stories from specific user
router.get('/user/:userId', getUserStories);

// Create new story
router.post('/', verifyClerkToken, createStory);

// Delete story
router.delete('/:storyId', verifyClerkToken, deleteStory);

export default router;