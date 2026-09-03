import { Server as SocketIO } from 'socket.io';

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
        process.env.FRONTEND_URL || 'http://localhost:5174'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
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

    socket.on('call-user', ({ userToCall, targetUserId, from, fromUserId, signalData, offer, isVideo }) => {
      const toUserId = userToCall || targetUserId;
      if (!toUserId) return;
      const payload = {
        from: from || fromUserId || socket.id,
        signal: signalData || offer || null,
        isVideo: Boolean(isVideo)
      };
      socket.to(`user-${toUserId}`).emit('incoming-call', payload);
      console.log(`📞 Call signaling: ${payload.from} -> ${toUserId} (${payload.isVideo ? 'video' : 'voice'})`);
    });

    socket.on('answer-call', ({ to, targetUserId, fromUserId, signal, answer }) => {
      const toUserId = to || targetUserId;
      if (!toUserId) return;
      socket.to(`user-${toUserId}`).emit('call-accepted', {
        from: fromUserId || socket.id,
        signal: signal || answer || null
      });
    });

    socket.on('ice-candidate', ({ to, targetUserId, senderId, candidate }) => {
      const toUserId = to || targetUserId;
      if (!toUserId || !candidate) return;
      socket.to(`user-${toUserId}`).emit('ice-candidate', {
        senderId: senderId || socket.id,
        candidate
      });
    });

    socket.on('end-call', ({ to, targetUserId }) => {
      const toUserId = to || targetUserId;
      if (!toUserId) return;
      socket.to(`user-${toUserId}`).emit('call-ended', {
        from: socket.id
      });
      console.log(`📞 Call ended signal sent to ${toUserId}`);
    });

    // Join a user-specific room for personal notifications/messages
    socket.on('join-user', (userId) => {
      if (!userId) return;
      const normalizedUserId = String(userId);
      socket.join(`user-${normalizedUserId}`);
      socket.userId = normalizedUserId;
      onlineUsers.set(normalizedUserId, { socketId: socket.id, lastSeen: new Date() });
      io.emit('user:online', { userId: normalizedUserId, online: true });
      socket.emit('presence:update', { onlineUsers: Array.from(onlineUsers.keys()) });
      console.log(`📍 Socket ${socket.id} joined user room: user-${normalizedUserId}`);
    });

    socket.on('leave-user', (userId) => {
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
