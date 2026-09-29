import { Server as SocketIO } from 'socket.io';
import { verifyToken as verifyClerkJwt } from '@clerk/backend';
import User from '../models/User.js';

let io = null;
const onlineUsers = new Map();

/**
 * Initialize Socket.io with the HTTP server
 * 
 * @param {http.Server} httpServer - The HTTP server instance
 * @returns {Server} The configured Socket.io instance
 */
export const initSocket = (httpServer) => {
  if (io) {
    console.warn('Socket.io already initialized');
    return io;
  }

  io = new SocketIO(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:5174',
        process.env.FRONTEND_URL || 'http://localhost:5174',
        'https://dev-threads-3.onrender.com',
        'https://dev-threads-jybl.onrender.com'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || !process.env.CLERK_SECRET_KEY) {
        return next(new Error('Socket authentication required'));
      }

      const claims = await verifyClerkJwt(token, { secretKey: process.env.CLERK_SECRET_KEY });
      const clerkId = claims?.sub;
      if (!clerkId) return next(new Error('Socket token has no Clerk subject'));

      const user = await User.findOne({ clerkId }).select('_id clerkId full_name');
      if (!user?._id) return next(new Error('Socket user not found'));

      socket.data.userId = String(user._id);
      socket.data.clerkId = clerkId;
      return next();
    } catch (error) {
      console.error('Socket authentication failed:', error?.message || error);
      return next(new Error('Socket authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join the feed room to receive real-time updates
    socket.on('join-feed', () => {
      socket.join('feed');
      console.log(`📍 Socket ${socket.id} joined 'feed' room`);
    });

    socket.on('send-message', ({ conversationId, senderId, recipientId, content, mediaUrl, messageType }) => {
      const payload = {
        conversationId,
        senderId,
        recipientId,
        content,
        mediaUrl,
        messageType,
        createdAt: new Date().toISOString()
      };

      if (conversationId) {
        socket.to(conversationId).emit('send-message', payload);
      }

      if (recipientId) {
        socket.to(`user-${recipientId}`).emit('send-message', payload);
      }

      if (senderId) {
        socket.to(`user-${senderId}`).emit('send-message', payload);
      }
    });

    socket.on('call:initiate', ({ to, offer, isVideo }) => {
      if (!to || !offer) return socket.emit('call:failed', { error: 'Call target and offer are required' });
      io.to(`user-${to}`).emit('call:ring', { from: socket.data.userId, offer, isVideo: Boolean(isVideo) });
    });

    socket.on('call:accept', ({ to, answer }) => {
      if (!to || !answer) return socket.emit('call:failed', { error: 'Call target and answer are required' });
      io.to(`user-${to}`).emit('call:answer', { from: socket.data.userId, answer });
    });

    socket.on('call:reject', ({ to, reason }) => {
      if (to) io.to(`user-${to}`).emit('call:reject', { from: socket.data.userId, reason: reason || 'Call rejected' });
    });

    socket.on('call:cancel', ({ to }) => {
      if (to) io.to(`user-${to}`).emit('call:cancel', { from: socket.data.userId });
    });

    socket.on('call:ice-candidate', ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(`user-${to}`).emit('call:ice-candidate', { from: socket.data.userId, candidate });
    });

    socket.on('call:end', ({ to }) => {
      if (to) io.to(`user-${to}`).emit('call:end', { from: socket.data.userId });
    });

    // Join a user-specific room for personal notifications/messages
    socket.on('join-user', () => {
      const normalizedUserId = socket.data.userId;
      if (!normalizedUserId) return;
      socket.join(`user-${normalizedUserId}`);
      socket.userId = normalizedUserId;
      onlineUsers.set(normalizedUserId, { socketId: socket.id, lastSeen: new Date() });
      io.emit('user:online', { userId: normalizedUserId, online: true });
      socket.emit('presence:update', { onlineUsers: Array.from(onlineUsers.keys()) });
      console.log(`📍 Socket ${socket.id} joined user room: user-${normalizedUserId}`);
    });

    socket.on('leave-user', () => {
      const userId = socket.data.userId;
      if (!userId) return;
      socket.leave(`user-${userId}`);
      onlineUsers.delete(String(userId));
      io.emit('user:offline', { userId: String(userId), online: false });
      console.log(`📍 Socket ${socket.id} left user room: user-${userId}`);
    });

    // Join a conversation/room for private messaging
    socket.on('join-room', (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`📍 Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('typing', ({ to, typing }) => {
      if (!to) return;
      io.to(`user-${to}`).emit('typing', {
        from: socket.data.userId,
        typing: Boolean(typing)
      });
    });

    socket.on('leave-room', (roomId) => {
      if (!roomId) return;
      socket.leave(roomId);
      console.log(`📍 Socket ${socket.id} left room: ${roomId}`);
    });

    // Leave the feed room
    socket.on('leave-feed', () => {
      socket.leave('feed');
      console.log(`📍 Socket ${socket.id} left 'feed' room`);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(String(socket.userId));
        io.emit('user:offline', { userId: String(socket.userId), online: false });
      }
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log(`🎯 Socket.io initialized successfully`);
  return io;
};

/**
 * Get the Socket.io instance
 * Must be called after initSocket() has been called
 * 
 * @throws {Error} If Socket.io has not been initialized
 * @returns {Server} The Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(httpServer) first.');
  }
  return io;
};

/**
 * Check if Socket.io is initialized
 * 
 * @returns {boolean} True if Socket.io is initialized
 */
export const isIOInitialized = () => {
  return io !== null;
};
