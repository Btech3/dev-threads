/**
 * Notification Service
 * 
 * What: Manages real-time notifications via WebSocket
 * When: Called when events occur (message, like, follow)
 * Why: Instant user feedback without page reload
 * How: Use Socket.IO to emit events to connected clients
 */

export class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Notify user of new message
   */
  notifyNewMessage(userId, message) {
    this.io.to(`user-${userId}`).emit('message:new', {
      id: message._id,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: new Date(),
      unread: true
    });
  }

  /**
   * Notify user of new like
   */
  notifyNewLike(userId, postId, likerName) {
    this.io.to(`user-${userId}`).emit('post:liked', {
      postId,
      likerName,
      timestamp: new Date()
    });
  }

  /**
   * Notify user of new follower
   */
  notifyNewFollower(userId, followerName, followerId) {
    this.io.to(`user-${userId}`).emit('user:followed', {
      followerId,
      followerName,
      timestamp: new Date()
    });
  }

  /**
   * Notify user of new comment
   */
  notifyNewComment(userId, postId, commenterName, commentText) {
    this.io.to(`user-${userId}`).emit('post:commented', {
      postId,
      commenterName,
      commentText: commentText.substring(0, 100),
      timestamp: new Date()
    });
  }

  /**
   * Notify typing indicator (user is typing)
   */
  notifyTyping(recipientId, senderName) {
    this.io.to(`user-${recipientId}`).emit('user:typing', {
      senderName,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast system notification to all users
   */
  broadcastSystemNotification(message) {
    this.io.emit('system:notification', {
      message,
      timestamp: new Date(),
      type: 'system'
    });
  }
}