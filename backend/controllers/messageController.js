import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notifications.js';
import { getIO } from '../config/socket.js';

/**
 * Get all conversations for a user
 * 
 * What: List all users the current user has chatted with
 * When: Called when opening messaging section
 * Why: Show conversation list/history
 * How: Find all unique users in messages, group, sort by latest
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all messages where user is sender or recipient
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { recipientId: userId }
          ]
        }
      },
      // Group by conversation (get latest message)
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$recipientId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipientId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      // Populate user details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    const conversations = messages.map(conv => ({
      userId: conv._id,
      user: {
        _id: conv.user._id,
        full_name: conv.user.full_name,
        profile_picture: conv.user.profile_picture,
        username: conv.user.username
      },
      lastMessage: conv.lastMessage.content,
      lastMessageTime: conv.lastMessage.createdAt,
      unreadCount: conv.unreadCount
    }));

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * Get all messages between two users
 * 
 * What: Retrieve conversation history between current user and another user
 * When: Called when opening a chat with specific user
 * Why: Display message history for context
 * How: Query messages, sort by date, mark as read
 */
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Get messages between two users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: userId },
        { senderId: userId, recipientId: currentUserId }
      ]
    })
      .populate('senderId', 'full_name profile_picture')
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      {
        recipientId: currentUserId,
        senderId: userId,
        isRead: false
      },
      { isRead: true }
    );

    const total = await Message.countDocuments({
      $or: [
        { senderId: currentUserId, recipientId: userId },
        { senderId: userId, recipientId: currentUserId }
      ]
    });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * Send a new message
 * 
 * What: Create and store new message between users
 * When: Called when user sends a message
 * Why: Enable direct messaging
 * How: Create message, save to DB, emit socket event, send notification
 */
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, media_url, mediaUrl, messageType, media } = req.body;
    const senderId = req.userId;

    console.log('[messageController] incoming req.body:', JSON.stringify(req.body, null, 2));

    const normalizeMedia = (rawMedia) => {
      if (Array.isArray(rawMedia)) {
        return rawMedia
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            url: item.url || item.mediaUrl || item.fileUrl || '',
            type: item.type || item.messageType || 'document',
            mimetype: item.mimetype || item.mimeType || '',
            size: Number(item.size) || 0,
            fileName: item.fileName || item.name || ''
          }))
          .filter((item) => item.url);
      }

      if (typeof rawMedia === 'string') {
        try {
          return normalizeMedia(JSON.parse(rawMedia));
        } catch (error) {
          return [];
        }
      }

      if (rawMedia && typeof rawMedia === 'object') {
        return normalizeMedia([rawMedia]);
      }

      return [];
    };

    const mediaUrlValue = mediaUrl || media_url || null;
    const mediaItemsFromUrl = mediaUrlValue
      ? [{ url: mediaUrlValue, type: messageType || 'document', mimetype: '', size: 0, fileName: '' }]
      : [];

    const normalizedMedia = normalizeMedia(media).length > 0 ? normalizeMedia(media) : mediaItemsFromUrl;

    if (!recipientId || !String(recipientId).trim()) {
      return res.status(400).json({ error: 'Recipient is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(String(recipientId))) {
      return res.status(400).json({ error: 'Invalid recipient ID format' });
    }

    const normalizedContent = typeof content === 'string' ? content.trim() : '';

    // Validate
    if (!normalizedContent && !mediaUrlValue && normalizedMedia.length === 0) {
      return res.status(400).json({ error: 'Message text or media is required' });
    }

    // Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const mediaItems = normalizedMedia.map((item) => ({
      url: item.url,
      type: item.type,
      mimetype: item.mimetype,
      size: item.size,
      fileName: item.fileName
    }));

    const message = new Message({
      senderId,
      recipientId,
      content: normalizedContent || null,
      media_url: mediaUrlValue || media_url || null,
      media: mediaItems,
      isRead: false
    });

    await message.save();
    await message.populate('senderId', 'full_name profile_picture username');

    // Send notification
    await sendNotification(
      recipientId,
      `New message from ${req.userDetails?.full_name || 'Someone'}`,
      `message-${message._id}`,
      `/messages/${senderId}`
    );

    // Emit Socket.IO event for real-time updates
    try {
      const io = getIO();
      io.to(`user-${recipientId}`).emit('message:received', {
        message,
        senderId,
        recipientId
      });
      io.to(`user-${senderId}`).emit('message:received', {
        message,
        senderId,
        recipientId
      });
    } catch (err) {
      console.warn('Socket emit skipped (not initialized):', err.message);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * Mark message as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify ownership
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Cannot delete other user messages' });
    }

    await Message.deleteOne({ _id: messageId });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};