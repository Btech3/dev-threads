import User from '../models/User.js';
import Post from '../models/Post.js';
import { getIO } from '../config/socket.js';

/**
 * Get user profile by ID
 * 
 * What: Retrieve complete user profile information
 * When: Called when viewing someone's profile
 * Why: Display user info, followers, following, posts
 * How: Query database by user ID and return sanitized data
 */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(userId)
      .select('-__v')
      .populate('followers', 'full_name profile_picture username')
      .populate('following', 'full_name profile_picture username');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count posts for this user
    const postCount = await Post.countDocuments({ userId });

    res.json({
      ...user.toObject(),
      postCount,
      followerCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update user profile
 * 
 * What: Modify user information (bio, location, profile picture, etc.)
 * When: Called when user edits their profile
 * Why: Allow users to customize their profile
 * How: Validate data, update database, return updated user
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, bio, location, cover_photo } = req.body;

    // Validate userId matches authenticated user
    if (req.userId !== userId) {
      return res.status(403).json({ error: 'Cannot update other user profiles' });
    }

    // Validate input
    if (!full_name || !bio) {
      return res.status(400).json({ error: 'Name and bio are required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        full_name,
        bio,
        location,
        cover_photo,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    try {
      const io = getIO();
      io.to(`user-${userId}`).emit('user:updated', {
        user,
        userId,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Emitted user:updated for ${userId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket emit skipped for user update:', socketError.message);
    }
    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Search users by name or username
 * 
 * What: Find users matching search query
 * When: Called when searching for other users
 * Why: Discover users, find friends, build connections
 * How: Query database with regex pattern, return limited results
 */
export const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10, skip = 0 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters',
        users: []
      });
    }

    // Case-insensitive search
    const searchRegex = new RegExp(q, 'i');
    
    const users = await User.find({
      $or: [
        { full_name: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ]
    })
      .select('_id full_name username profile_picture bio')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments({
      $or: [
        { full_name: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ]
    });

    res.json({
      users,
      total,
      hasMore: skip + users.length < total
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

/**
 * Get user statistics
 * 
 * What: Aggregate user metrics (posts, followers, etc.)
 * When: Called for profile stats display
 * Why: Show user engagement and activity metrics
 * How: Count related documents and return stats
 */
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('followers following');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const postCount = await Post.countDocuments({ userId });
    const likedPosts = await Post.countDocuments({ 
      likes: userId 
    });

    res.json({
      postCount,
      followerCount: user.followers.length,
      followingCount: user.following.length,
      likedPostsCount: likedPosts
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

/**
 * Get user's followers
 */
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('followers', 'full_name profile_picture username bio');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      followers: user.followers,
      count: user.followers.length
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
};

/**
 * Get users that this user is following
 */
export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('following', 'full_name profile_picture username bio');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      following: user.following,
      count: user.following.length
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
};

/**
 * Get current authenticated user
 * Requires: Clerk authentication token
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .select('-__v')
      .populate('followers', 'full_name profile_picture username')
      .populate('following', 'full_name profile_picture username');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const postCount = await Post.countDocuments({ userId });

    res.json({
      ...user.toObject(),
      postCount,
      followerCount: user.followers.length,
      followingCount: user.following.length
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
};

/**
 * Get user by Clerk ID
 * Used during login to check if user exists in database
 */
export const getUserByClerkId = async (req, res) => {
  try {
    const { clerkId } = req.params;

    const user = await User.findOne({ clerkId })
      .select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const postCount = await Post.countDocuments({ _id: user._id });

    res.json({
      ...user.toObject(),
      postCount,
      followerCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    });
  } catch (error) {
    console.error('Get user by Clerk ID error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Create a new user (called on first login/signup)
 * Syncs Clerk authentication with MongoDB
 */
export const createUser = async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, profilePicture, username } = req.body;

    // Validate required fields
    if (!clerkId || !email) {
      return res.status(400).json({ error: 'clerkId and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      clerkId,
      email,
      full_name: `${firstName || ''} ${lastName || ''}`.trim() || 'User',
      username: username || email.split('@')[0],
      profile_picture: profilePicture || null,
      followers: [],
      following: [],
      connections: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Get user suggestions (for discover page)
 * Returns users that authenticated user is not following
 */
export const getUserSuggestions = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10 } = req.query;

    const currentUser = await User.findById(userId)
      .select('following');

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get users that current user is NOT following
    const suggestions = await User.find({
      _id: {
        $nin: [...currentUser.following, userId] // Exclude current user and users already following
      }
    })
      .select('_id full_name username profile_picture bio')
      .limit(parseInt(limit))
      .lean();

    res.json({
      suggestions,
      count: suggestions.length
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

/**
 * Update current user (me)
 * Requires: Clerk authentication token
 */
export const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { full_name, bio, location, cover_photo, profile_picture, website } = req.body;

    const updatePayload = {
      updatedAt: new Date()
    };

    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (bio !== undefined) updatePayload.bio = bio;
    if (location !== undefined) updatePayload.location = location;
    if (cover_photo !== undefined) updatePayload.cover_photo = cover_photo;
    if (profile_picture !== undefined) updatePayload.profile_picture = profile_picture;
    if (website !== undefined) updatePayload.website = website;

    const user = await User.findByIdAndUpdate(userId, updatePayload, { new: true }).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const io = getIO();
      io.to(`user-${userId}`).emit('user:updated', {
        user,
        userId,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Emitted user:updated for ${userId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket emit skipped for current user update:', socketError.message);
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};