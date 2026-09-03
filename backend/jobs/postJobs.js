import inngest from '../config/inngest.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notifications.js';

/**
 * Job: Send post creation notifications to followers
 * 
 * What: Notify followers when user posts
 * When: After post is created
 * Why: Keep followers updated without blocking post creation
 * How: INNGEST triggers this async job
 */
export const notifyFollowersOnPost = inngest.createFunction(
  // COMBINED: ID/Name and event trigger must live in this single object (1st argument)
  { 
    id: 'post-notify-followers', // Best practice: include a unique string ID
    name: 'Post: Notify Followers',
    triggers: [{ event: 'post.created' }] 
  },
  // 2nd argument is the async handler function
  async ({ event, step }) => {
    const { userId, postId } = event.data;

    // Step 1: Get user and their followers
    const user = await step.run('fetch-user', async () => {
      return await User.findById(userId)
        .populate('followers', '_id');
    });

    if (!user) return;

    // Step 2: Send notifications to followers
    await step.run('notify-followers', async () => {
      const notificationPromises = user.followers.map(follower =>
        sendNotification(
          follower._id,
          `${user.full_name} posted something new`,
          `post-${postId}`,
          `/post/${postId}`
        )
      );

      return Promise.all(notificationPromises);
    });

    return { notified: user.followers.length };
  }
);

/**
 * Job: Process hashtags and update trending
 */
export const processPostHashtags = inngest.createFunction(
  // COMBINED: Configuration and trigger combined here too
  { 
    id: 'post-process-hashtags',
    name: 'Post: Process Hashtags',
    triggers: [{ event: 'post.created' }] 
  },
  // 2nd argument is the async handler function
  async ({ event, step }) => {
    const { content, postId } = event.data;

    // Extract hashtags
    const hashtags = content.match(/#\w+/g) || [];

    if (hashtags.length === 0) return;

    // Step: Update hashtag counts (implement Hashtag model)
    await step.run('update-hashtags', async () => {
      // Query database for hashtag collection
      // Increment counts for trending calculation
      console.log('Updated hashtags:', hashtags);
    });
  }
);