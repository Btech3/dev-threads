import io from 'socket.io-client';

// Support env coming from import.meta.env (Vite) or process.env (Node), and normalize
const rawSocketUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SOCKET_URL) || process.env.VITE_SOCKET_URL;
function normalizeSocketUrl(url) {
  if (!url) return 'http://localhost:5234';
  let s = String(url).trim();
  s = s.replace(/:\s*$/,'');
  s = s.replace(/localhost(\d{2,5})/i, 'localhost:$1');
  if (!/^[a-zA-Z]+:\/\//.test(s)) s = `http://${s}`;
  return s;
}

const SOCKET_URL = normalizeSocketUrl(rawSocketUrl) || 'http://localhost:5234';

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
      this.emit('socketConnected', { socketId: this.socket.id });
    });

    // Disconnect event
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.emit('socketDisconnected');
    });

    // Error event
    this.socket.on('connect_error', (error) => {
      console.error('Socket error:', error);
      this.emit('socketError', error);
    });

    // Listen for all real-time events
    this.setupEventListeners();
  }

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Post events
    this.socket.on('post:created', (data) => this.emit('postCreated', data));
    this.socket.on('post:updated', (data) => this.emit('postUpdated', data));
    this.socket.on('post:deleted', (data) => this.emit('postDeleted', data));
    this.socket.on('post:liked', (data) => this.emit('postLiked', data));
    this.socket.on('post:unliked', (data) => this.emit('postUnliked', data));
    this.socket.on('post:commented', (data) => this.emit('postCommented', data));

    // Message events
    this.socket.on('message:sent', (data) => this.emit('messageSent', data));
    this.socket.on('message:received', (data) => this.emit('messageReceived', data));
    this.socket.on('message:read', (data) => this.emit('messageRead', data));
    this.socket.on('typing', (data) => this.emit('typing', data));

    // Connection events
    this.socket.on('user:followed', (data) => this.emit('userFollowed', data));
    this.socket.on('user:unfollowed', (data) => this.emit('userUnfollowed', data));

    // Story events
    this.socket.on('story:created', (data) => this.emit('storyCreated', data));
    this.socket.on('story:deleted', (data) => this.emit('storyDeleted', data));

    // Notification events
    this.socket.on('notification', (data) => this.emit('notification', data));
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

  // Emit to socket server
  socketEmit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }

  // Remove listener
  off(eventName) {
    delete this.listeners[eventName];
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton
export const socketService = new SocketService();
