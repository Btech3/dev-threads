import io from 'socket.io-client';

// Normalize socket URL from env to avoid malformed values like "http://localhost5234:"
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
function normalizeSocketUrl(url) {
  if (!url) return 'https://dev-threads-2.onrender.com';
  let s = String(url).trim();
  // Remove accidental trailing colons
  s = s.replace(/:\s*$/,'');
  // If someone wrote localhost5234 (missing colon), insert colon between host and port
  s = s.replace(/localhost(\d{2,5})/i, 'localhost:$1');
  // Ensure scheme exists
  if (!/^[a-zA-Z]+:\/\//.test(s)) {
    s = `http://${s}`;
  }
  return s;
}

const SOCKET_URL = normalizeSocketUrl(rawSocketUrl) || 'https://dev-threads-2.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  // Connect to socket server
  connect(clerkId) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        clerkId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection event
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      
      // Join feed room for real-time updates
      this.socket.emit('join-feed');
      
      // Join user room for profile and personal notifications
      if (clerkId) {
        this.socket.emit('join-user', clerkId);
      }
      
      this.emit('socketConnected', { socketId: this.socket.id });
    });

    // Disconnect event
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('socketDisconnected');
    });

    // Error event
    this.socket.on('connect_error', (error) => {
      console.error('Socket connect_error:', error?.message || error);
      this.emit('socketError', error);
    });

    // Reconnection lifecycle logging
    this.socket.on('reconnect_attempt', (attempt) => {
      console.warn('Socket reconnect attempt', attempt);
    });
    this.socket.on('reconnect_failed', (error) => {
      console.error('Socket reconnect failed', error);
    });
    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnect error', error);
    });

    // Listen for all real-time events
    this.setupEventListeners();
  }

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // ========================================
    // POST EVENTS
    // ========================================

    // New post created - emit for feed update
    this.socket.on('post:created', (data) => {
      console.log('📡 Socket Event: post:created', data);
      this.emit('postCreated', data);
    });

    // Compatibility alias for older backend naming
    this.socket.on('post_created', (data) => {
      console.log('📡 Socket Event: post_created', data);
      this.emit('postCreated', data);
    });

    // Post deleted
    this.socket.on('post:deleted', (data) => {
      console.log('📡 Socket Event: post:deleted', data);
      this.emit('postDeleted', data);
    });

    // ========================================
    // ENGAGEMENT EVENTS (Real-Time)
    // ========================================
    
    // Post engagement update (like, comment, share, bookmark)
    this.socket.on('post:engagement_update', (data) => {
      console.log('📡 Socket Event: post:engagement_update', data);
      
      // Re-emit specific events based on action type
      const action = data.action;
      switch (action) {
        case 'like':
          this.emit('postLiked', data);
          break;
        case 'unlike':
          this.emit('postUnliked', data);
          break;
        case 'comment':
          this.emit('postCommented', data);
          break;
        case 'comment_react':
          this.emit('postCommentReacted', data);
          break;
        case 'comment_reply':
          this.emit('postCommentReplied', data);
          break;
        case 'delete_comment':
          this.emit('postCommentDeleted', data);
          break;
        case 'share':
          this.emit('postShared', data);
          break;
        case 'unshare':
          this.emit('postUnshared', data);
          break;
        case 'bookmark':
          this.emit('postBookmarked', data);
          break;
        case 'unbookmark':
          this.emit('postBookmarkRemoved', data);
          break;
        default:
          this.emit('postEngagementUpdate', data);
      }
    });

    // ========================================
    // MESSAGE EVENTS
    // ========================================
    
    this.socket.on('message:sent', (data) => {
      console.log('📡 Socket Event: message:sent', data);
      this.emit('messageSent', data);
    });
    
    this.socket.on('message:received', (data) => {
      console.log('📡 Socket Event: message:received', data);
      this.emit('messageReceived', data);
    });
    
    this.socket.on('message:read', (data) => {
      console.log('📡 Socket Event: message:read', data);
      this.emit('messageRead', data);
    });
    
    this.socket.on('typing', (data) => {
      this.emit('typing', data);
    });

    // ========================================
    // CONNECTION EVENTS
    // ========================================
    
    this.socket.on('user:followed', (data) => {
      console.log('📡 Socket Event: user:followed', data);
      this.emit('userFollowed', data);
    });
    
    this.socket.on('user:unfollowed', (data) => {
      console.log('📡 Socket Event: user:unfollowed', data);
      this.emit('userUnfollowed', data);
    });

    // ========================================
    // STORY EVENTS
    // ========================================
    
    this.socket.on('story:created', (data) => {
      console.log('📡 Socket Event: story:created', data);
      this.emit('storyCreated', data);
    });
    
    this.socket.on('story:deleted', (data) => {
      console.log('📡 Socket Event: story:deleted', data);
      this.emit('storyDeleted', data);
    });

    // ========================================
    // NOTIFICATION EVENTS
    // ========================================
    
    this.socket.on('notification', (data) => {
      console.log('📡 Socket Event: notification', data);
      this.emit('notification', data);
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emit events
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((callback) => callback(data));
    }
  }

  // Listen to events
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[eventName] = this.listeners[eventName].filter(
        (cb) => cb !== callback
      );
    };
  }

  // Send event to server
  send(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }

  // Backward-compatible alias for legacy code
  socketEmit(eventName, data) {
    this.send(eventName, data);
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
