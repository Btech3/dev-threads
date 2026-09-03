import Story from '../models/Story.js';

/**
 * Get all active stories
 * 
 * What: Retrieve non-expired stories from followed users
 * When: Called when loading stories bar at top of feed
 * Why: Display stories feed similar to Instagram/Snapchat
 * How: Query stories, filter expired, populate user data
 */
export const getActiveStories = async (req, res) => {
  try {
    const { userId } = req.query;
    const now = new Date();

    let query = { expiresAt: { $gt: now } };

    // Get stories from followed users
    if (userId) {
      const user = await User.findById(userId)
        .select('following');
      
      if (user) {
        query.userId = {
          $in: [...user.following, userId]
        };
      }
    }

    const stories = await Story.find(query)
      .populate('userId', 'full_name profile_picture username')
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userKey = story.userId._id.toString();
      if (!acc[userKey]) {
        acc[userKey] = {
          userId: story.userId._id,
          user: story.userId,
          stories: []
        };
      }
      acc[userKey].stories.push({
        _id: story._id,
        content: story.content,
        media_url: story.media_url,
        media_type: story.media_type,
        background_color: story.background_color,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt
      });
      return acc;
    }, {});

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
};

/**
 * Create a new story
 * 
 * What: Create a temporary story that expires in 24 hours
 * When: Called when user posts a story
 * Why: Allow sharing temporary content
 * How: Validate, create story, set expiry time, save to DB
 */
export const createStory = async (req, res) => {
  try {
    const { content, media_url, media_type, background_color } = req.body;
    const userId = req.userId;

    // Validate
    if (!content && !media_url) {
      return res.status(400).json({ error: 'Story content is required' });
    }

    // Create story
    const story = new Story({
      userId,
      content,
      media_url,
      media_type: media_type || 'text',
      background_color: background_color || '#000000',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await story.save();
    await story.populate('userId', 'full_name profile_picture username');

    res.status(201).json({
      message: 'Story created successfully',
      story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
};

/**
 * Get stories from specific user
 */
export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();

    const stories = await Story.find({
      userId,
      expiresAt: { $gt: now }
    })
      .populate('userId', 'full_name profile_picture username')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
};

/**
 * Delete a story (by creator)
 */
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.userId;

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Verify ownership
    if (story.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Cannot delete other user stories' });
    }

    await Story.deleteOne({ _id: storyId });

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
};