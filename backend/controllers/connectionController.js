import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { getIO } from '../config/socket.js';
import { sendNotification } from '../utils/notifications.js';

/**
 * Get all connections for a user
 * 
 * What: List users that current user is connected with
 * When: Called when viewing connections list
 * Why: Show network of connections
 * How: Query accepted connections, populate user details
 */
export const getConnections = async (req, res) => {
  try {
    const userId = req.userId;

    const connections = await Connection.find({
      $or: [
        { userId, status: 'accepted' },
        { targetUserId: userId, status: 'accepted' }
      ]
    })
      .populate('userId', 'full_name profile_picture username')
      .populate('targetUserId', 'full_name profile_picture username');

    // Format response
    const formattedConnections = connections.map(conn => {
      const isInitiator = conn.userId._id.toString() === userId;
      return {
        connectionId: conn._id,
        user: isInitiator ? conn.targetUserId : conn.userId,
        status: conn.status,
        connectedAt: conn.createdAt
      };
    });

    res.json({
      connections: formattedConnections,
      count: formattedConnections.length
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
};

/**
 * Follow a user
 * 
 * What: Add user to followers/following arrays
 * When: Called when user clicks follow button
 * Why: Build user network and connections
 * How: Create connection record and update both users
 */
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Validate
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingConnection = await Connection.findOne({
      userId: currentUserId,
      targetUserId: userId
    });

    if (existingConnection && existingConnection.status === 'accepted') {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Check target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update or create connection
    let connection = await Connection.findOneAndUpdate(
      { userId: currentUserId, targetUserId: userId },
      { status: 'accepted' },
      { upsert: true, new: true }
    );

    // Update user arrays
    const currentUser = await User.findById(currentUserId);
    const targetUserDoc = await User.findById(userId);

    if (!currentUser.following.includes(userId)) {
      currentUser.following.push(userId);
      await currentUser.save();
    }

    if (!targetUserDoc.followers.includes(currentUserId)) {
      targetUserDoc.followers.push(currentUserId);
      await targetUserDoc.save();
    }

    // Send notification
    await sendNotification(
      userId,
      `${currentUser.full_name || 'Someone'} started following you`,
      `follow-${currentUserId}`,
      `/profile/${currentUserId}`
    );

    try {
      const io = getIO();
      io.to(`user-${userId}`).emit('user:followed', {
        followerId: currentUserId,
        followerName: currentUser.full_name,
        followerUsername: currentUser.username,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      io.to(`user-${currentUserId}`).emit('user:followed', {
        followerId: currentUserId,
        followerName: currentUser.full_name,
        followerUsername: currentUser.username,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.warn('⚠️ Socket emit skipped for follow event:', socketError.message);
    }

    res.status(201).json({
      message: 'User followed successfully',
      connection
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    // Remove from following/followers arrays
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (currentUser && targetUser) {
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== userId
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUserId
      );

      await currentUser.save();
      await targetUser.save();
    }

    // Delete connection
    await Connection.deleteOne({
      userId: currentUserId,
      targetUserId: userId
    });

    try {
      const io = getIO();
      io.to(`user-${userId}`).emit('user:unfollowed', {
        userId: currentUserId,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
      io.to(`user-${currentUserId}`).emit('user:unfollowed', {
        userId: currentUserId,
        targetUserId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.warn('⚠️ Socket emit skipped for unfollow event:', socketError.message);
    }

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

/**
 * Get followers of current user
 */
export const getFollowers = async (req, res) => {
  try {
    const userId = req.userId;

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
 * Get users that current user is following
 */
export const getFollowing = async (req, res) => {
  try {
    const userId = req.userId;

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
 * Get pending friend requests
 */
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const pendingRequests = await Connection.find({
      targetUserId: userId,
      status: 'pending'
    })
      .populate('userId', 'full_name profile_picture username');

    res.json({
      requests: pendingRequests,
      count: pendingRequests.length
    });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};

/**
 * Accept a friend request
 */
export const acceptRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const connection = await Connection.findOneAndUpdate(
      { userId, targetUserId: currentUserId, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    ).populate('userId', 'full_name');

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    res.json({
      message: 'Connection accepted',
      connection
    });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
};

/**
 * Reject a friend request
 */
export const rejectRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    await Connection.deleteOne({
      userId,
      targetUserId: currentUserId,
      status: 'pending'
    });

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
};