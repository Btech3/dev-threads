
import express from 'express';
import { serve } from 'inngest/express';
import inngest from '../config/inngest.js';
import {
  notifyFollowersOnPost,
  processPostHashtags
} from '../jobs/postJobs.js';

const router = express.Router();

// Register INNGEST functions
router.use('/inngest', serve({
  client: inngest,
  functions: [
    notifyFollowersOnPost,
    processPostHashtags
    // Add more functions here
  ]
}));

export default router;