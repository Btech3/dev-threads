# Real-Time Communication Setup Guide - Dev Thread

Complete guide to implementing Socket.IO for real-time, live communication across the Dev Thread platform.

---

## 📋 Table of Contents

1. [What is Socket.IO?](#what-is-socketio)
2. [Backend Socket.IO Setup](#backend-socketio-setup)
3. [Real-Time Event Specifications](#real-time-event-specifications)
4. [Frontend Socket Integration](#frontend-socket-integration)
5. [Real-Time Feature Implementations](#real-time-feature-implementations)
6. [Broadcasting & Rooms](#broadcasting--rooms)
7. [Error Handling & Reconnection](#error-handling--reconnection)
8. [Testing Real-Time Features](#testing-real-time-features)

---

## 🔌 What is Socket.IO?

**Socket.IO** enables real-time, bidirectional communication between clients and servers:

- ✅ Live message delivery
- ✅ Real-time notifications
- ✅ Instant activity updates
- ✅ Typing indicators
- ✅ Online status
- ✅ Live notifications

### How It Works

```
FRONTEND (Client)              BACKEND (Server)
     ↓                              ↓
1. Connect               →    1. Accept connection
2. Listen for events     ←    2. Emit events
3. Emit events           →    3. Listen & respond
4. Update UI             ←    4. Send to other clients
```

---

## 🛠️ Backend Socket.IO Setup

### Step 1: Verify Dependencies

Socket.IO is already in `package.json`. Verify:

```bash
npm list socket.io
```

Should show: `socket.io@4.8.3`

### Step 2: Update Server File

Update `dev-thread-backend/server.js`:

```javascript
// dev-thread-backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import connectionRoutes from './routes/connections.js';
import storyRoutes from './routes/stories.js';
import inngestRoutes from './routes/inngest.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Store connected users
const connectedUsers = new Map();

// ============================================
// SOCKET.IO EVENT HANDLERS
// ============================================

io.on('connection', (socket) => {
  const clerkId = socket.handshake.auth.clerkId;

  console.log(`User connected: ${clerkId} (Socket ID: ${socket.id})`);

  // Store user connection
  connectedUsers.set(clerkId, {
    socketId: socket.id,
    userId: clerkId,
    connectedAt: new Date()
  });

  // Notify all users about online status
  io.emit('user:online', {
    userId: clerkId,
    socketId: socket.id,
    timestamp: new Date()
  });

  // ========== AUTHENTICATION & CONNECTION ==========

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${clerkId}`);
    connectedUsers.delete(clerkId);
    io.emit('user:offline', { userId: clerkId });
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${clerkId}:`, error);
  });

  // ========== POST EVENTS ==========

  // Broadcast when new post is created
  socket.on('post:create', (data) => {
    console.log(`New post from ${clerkId}:`, data._id);
    io.emit('post:created', {
      ...data,
      userId: clerkId,
      timestamp: new Date()
    });
  });

  // Broadcast when post is updated
  socket.on('post:update', (data) => {
    io.emit('post:updated', {
      ...data,
      updatedBy: clerkId,
      timestamp: new Date()
    });
  });

  // Broadcast when post is deleted
  socket.on('post:delete', (postId) => {
    io.emit('post:deleted', {
      postId,
      deletedBy: clerkId,
      timestamp: new Date()
    });
  });

  // Broadcast like event
  socket.on('post:like', (data) => {
    io.emit('post:liked', {
      postId: data.postId,
      userId: clerkId,
      timestamp: new Date()
    });
  });

  // Broadcast unlike event
  socket.on('post:unlike', (data) => {
    io.emit('post:unliked', {
      postId: data.postId,
      userId: clerkId,
      timestamp: new Date()
    });
  });

  // Broadcast comment event
  socket.on('post:comment', (data) => {
    io.emit('post:commented', {
      postId: data.postId,
      commentId: data.commentId,
      userId: clerkId,
      text: data.text,
      timestamp: new Date()
    });
  });

  // ========== MESSAGE EVENTS ==========

  // Join private room for one-on-one messaging
  socket.on('message:room:join', (data) => {
    const roomName = [clerkId, data.recipientId].sort().join(':');
    socket.join(roomName);
    console.log(`${clerkId} joined room: ${roomName}`);
  });

  // Leave private room
  socket.on('message:room:leave', (data) => {
    const roomName = [clerkId, data.recipientId].sort().join(':');
    socket.leave(roomName);
    console.log(`${clerkId} left room: ${roomName}`);
  });

  // Send private message to specific user
  socket.on('message:send', (data) => {
    const roomName = [clerkId, data.recipientId].sort().join(':');
    
    io.to(roomName).emit('message:received', {
      _id: data.messageId || new Date().getTime(),
      senderId: clerkId,
      recipientId: data.recipientId,
      content: data.content,
      media_url: data.media_url || null,
      isRead: false,
      createdAt: new Date(),
      senderName: data.senderName
    });

    console.log(`Message from ${clerkId} to ${data.recipientId}`);
  });

  // Mark message as read
  socket.on('message:read', (data) => {
    const recipientUser = connectedUsers.get(data.recipientId);
    if (recipientUser) {
      io.to(recipientUser.socketId).emit('message:read', {
        messageId: data.messageId,
        userId: clerkId
      });
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const recipientUser = connectedUsers.get(data.recipientId);
    if (recipientUser) {
      io.to(recipientUser.socketId).emit('typing', {
        senderId: clerkId,
        recipientId: data.recipientId,
        isTyping: data.isTyping
      });
    }
  });

  // ========== CONNECTION/FOLLOW EVENTS ==========

  // Broadcast follow event
  socket.on('user:follow', (data) => {
    io.emit('user:followed', {
      followerId: clerkId,
      followingId: data.userId,
      timestamp: new Date()
    });

    // Notify the followed user
    const followedUser = connectedUsers.get(data.userId);
    if (followedUser) {
      io.to(followedUser.socketId).emit('notification', {
        type: 'follow',
        from: clerkId,
        message: `${data.userName} started following you`,
        timestamp: new Date()
      });
    }
  });

  // Broadcast unfollow event
  socket.on('user:unfollow', (data) => {
    io.emit('user:unfollowed', {
      followerId: clerkId,
      followingId: data.userId,
      timestamp: new Date()
    });
  });

  // ========== STORY EVENTS ==========

  // Broadcast new story
  socket.on('story:create', (data) => {
    io.emit('story:created', {
      ...data,
      userId: clerkId,
      timestamp: new Date()
    });
  });

  // Broadcast story deletion
  socket.on('story:delete', (storyId) => {
    io.emit('story:deleted', {
      storyId,
      deletedBy: clerkId,
      timestamp: new Date()
    });
  });

  // ========== NOTIFICATION EVENTS ==========

  // Send notification to specific user
  socket.on('notification:send', (data) => {
    const recipientUser = connectedUsers.get(data.recipientId);
    if (recipientUser) {
      io.to(recipientUser.socketId).emit('notification', {
        type: data.type,
        from: clerkId,
        message: data.message,
        actionUrl: data.actionUrl,
        timestamp: new Date()
      });
    }
  });

  // Broadcast system notification to all
  socket.on('notification:broadcast', (data) => {
    io.emit('notification', {
      type: data.type,
      message: data.message,
      timestamp: new Date()
    });
  });

  // ========== ACTIVITY STATUS ==========

  // Broadcast activity status
  socket.on('activity:status', (data) => {
    io.emit('activity:status', {
      userId: clerkId,
      status: data.status, // 'viewing_feed', 'viewing_messages', 'idle'
      timestamp: new Date()
    });
  });
});

// ============================================
// REST OF SERVER CONFIGURATION
// ============================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Clerk-ID', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/inngest', inngestRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ============================================
// DATABASE CONNECTION
// ============================================

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📊 Socket.IO ready for real-time communication`);
});

export default app;
```

---

## 📡 Real-Time Event Specifications

### Post Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `post:create` | Client → Server | `{ content, media, ... }` | Create new post |
| `post:created` | Server → All | `{ _id, userId, content, ... }` | Notify new post |
| `post:update` | Client → Server | `{ postId, content, ... }` | Update existing post |
| `post:updated` | Server → All | `{ postId, updatedBy, ... }` | Notify post update |
| `post:delete` | Client → Server | `{ postId }` | Delete post |
| `post:deleted` | Server → All | `{ postId, deletedBy }` | Notify deletion |
| `post:like` | Client → Server | `{ postId }` | Like a post |
| `post:liked` | Server → All | `{ postId, userId }` | Notify like |
| `post:unlike` | Client → Server | `{ postId }` | Unlike post |
| `post:unliked` | Server → All | `{ postId, userId }` | Notify unlike |
| `post:comment` | Client → Server | `{ postId, text }` | Add comment |
| `post:commented` | Server → All | `{ postId, commentId, userId, text }` | Notify comment |

### Message Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `message:room:join` | Client → Server | `{ recipientId }` | Join private chat room |
| `message:send` | Client → Server | `{ recipientId, content, media_url }` | Send message |
| `message:received` | Server → Room | `{ senderId, recipientId, content, ... }` | Receive message |
| `message:read` | Client → Server | `{ messageId, recipientId }` | Mark as read |
| `typing` | Client → Server | `{ recipientId, isTyping }` | Typing indicator |
| `typing` | Server → Room | `{ senderId, isTyping }` | Show typing |

### Connection Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `user:online` | Server → All | `{ userId, socketId }` | User comes online |
| `user:offline` | Server → All | `{ userId }` | User goes offline |
| `user:follow` | Client → Server | `{ userId, userName }` | Follow user |
| `user:followed` | Server → All | `{ followerId, followingId }` | Notify follow |
| `user:unfollow` | Client → Server | `{ userId }` | Unfollow user |
| `user:unfollowed` | Server → All | `{ followerId, followingId }` | Notify unfollow |

### Story Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `story:create` | Client → Server | `{ content, media_url, media_type, ... }` | Create story |
| `story:created` | Server → All | `{ _id, userId, content, ... }` | Notify new story |
| `story:delete` | Client → Server | `{ storyId }` | Delete story |
| `story:deleted` | Server → All | `{ storyId, deletedBy }` | Notify deletion |

### Notification Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `notification:send` | Client → Server | `{ recipientId, type, message }` | Send notification |
| `notification:broadcast` | Client → Server | `{ type, message }` | Broadcast to all |
| `notification` | Server → Client | `{ type, message, timestamp }` | Receive notification |

---

## 🔗 Frontend Socket Integration

### Socket Service (Updated)

Already created in `src/services/socketService.js`, with all events configured.

### Usage in Components

#### Example 1: Real-Time Post Creation

```javascript
// Component
import { socketService } from '../services/socketService';
import { postService } from '../services/postService';

function CreatePostForm() {
  const handleSubmit = async (formData) => {
    try {
      // Create post via API
      const newPost = await postService.createPost(formData);
      
      // Emit via Socket.IO
      socketService.socketEmit('post:create', newPost);
      
      // Show success message
      console.log('Post created and broadcasted!');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }}>
      {/* Form fields */}
    </form>
  );
}
```

#### Example 2: Real-Time Message Reception

```javascript
import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

function MessageThread({ selectedUserId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Join private room with selected user
    socketService.socketEmit('message:room:join', { 
      recipientId: selectedUserId 
    });

    // Listen for incoming messages
    const unsubscribe = socketService.on('message:received', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubscribe();
      socketService.socketEmit('message:room:leave', { 
        recipientId: selectedUserId 
      });
    };
  }, [selectedUserId]);

  return (
    <div className="messages">
      {messages.map((msg) => (
        <div key={msg._id} className="message">
          <p>{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Example 3: Typing Indicator

```javascript
import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

function MessageInput({ recipientId }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Emit typing event
    socketService.socketEmit('typing', {
      recipientId,
      isTyping: true
    });
  };

  // Listen for other user typing
  useEffect(() => {
    const unsubscribe = socketService.on('typing', (data) => {
      if (data.senderId === recipientId) {
        setIsTyping(data.isTyping);
      }
    });

    return unsubscribe;
  }, [recipientId]);

  return (
    <>
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        placeholder="Type a message..."
      />
      {isTyping && <small>User is typing...</small>}
    </>
  );
}
```

---

## 🎯 Real-Time Feature Implementations

### Feature 1: Live Feed Updates

```javascript
// In Feed.jsx
import { useEffect, useState } from 'react';
import { postService } from '../services/postService';
import { socketService } from '../services/socketService';

export function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Initial load
    loadFeed();

    // Listen for new posts
    const unsubscribe = socketService.on('post:created', (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
      showNotification(`${newPost.user.full_name} posted!`);
    });

    return unsubscribe;
  }, []);

  const loadFeed = async () => {
    const data = await postService.getFeed();
    setPosts(data.data);
  };

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
```

### Feature 2: Real-Time Notifications

```javascript
// NotificationCenter.jsx
import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for notifications
    const unsubscribe = socketService.on('notification', (notification) => {
      setNotifications((prev) => [
        ...prev,
        {
          ...notification,
          id: Date.now()
        }
      ]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 5000);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="notifications">
      {notifications.map((notif) => (
        <div key={notif.id} className="notification">
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  );
}
```

### Feature 3: Online Status

```javascript
// UserStatus.jsx
import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

export function UserStatus({ userId }) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check if user is online
    const users = socketService.connectedUsers;
    setIsOnline(users.has(userId));

    // Listen for online events
    const unsubUser = socketService.on('user:online', (data) => {
      if (data.userId === userId) setIsOnline(true);
    });

    const unsubOffline = socketService.on('user:offline', (data) => {
      if (data.userId === userId) setIsOnline(false);
    });

    return () => {
      unsubUser();
      unsubOffline();
    };
  }, [userId]);

  return (
    <span className={isOnline ? 'online' : 'offline'}>
      {isOnline ? '🟢 Online' : '⚫ Offline'}
    </span>
  );
}
```

### Feature 4: Live Like Counter

```javascript
// PostCard.jsx
import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

export function PostCard({ post: initialPost }) {
  const [post, setPost] = useState(initialPost);

  useEffect(() => {
    // Listen for likes on this post
    const unsubscribeLike = socketService.on('post:liked', (data) => {
      if (data.postId === post._id) {
        setPost((prev) => ({
          ...prev,
          likes_count: (prev.likes_count || 0) + 1
        }));
      }
    });

    const unsubscribeUnlike = socketService.on('post:unliked', (data) => {
      if (data.postId === post._id) {
        setPost((prev) => ({
          ...prev,
          likes_count: Math.max(0, (prev.likes_count || 1) - 1)
        }));
      }
    });

    return () => {
      unsubscribeLike();
      unsubscribeUnlike();
    };
  }, [post._id]);

  return (
    <div className="post">
      <p>{post.content}</p>
      <div className="likes">
        ❤️ {post.likes_count} likes
      </div>
    </div>
  );
}
```

---

## 🌐 Broadcasting & Rooms

### Concept: Rooms

Rooms allow you to broadcast to specific groups of users:

```javascript
// Backend: Send to specific room
io.to(roomName).emit('event', data);

// Backend: Send to everyone except sender
socket.broadcast.emit('event', data);

// Frontend: Listen for room events
socketService.on('event', (data) => {...});
```

### Private Message Rooms

```javascript
// Backend: Create unique room for each conversation
const roomName = [userId1, userId2].sort().join(':');
// Result: 'user_1:user_2'

// Both users join same room
socket.join(roomName);

// Messages in this room only go to both users
io.to(roomName).emit('message:received', data);
```

### Broadcast to All Except Sender

```javascript
// Backend
socket.broadcast.emit('post:liked', {
  postId: data.postId,
  userId: clerkId
  // Sender doesn't get this - they already know they liked
});
```

---

## 🔄 Error Handling & Reconnection

### Automatic Reconnection

Socket.IO handles reconnection automatically:

```javascript
// Already configured in socketService.js
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});
```

### Handle Reconnection in Frontend

```javascript
// src/services/socketService.js
this.socket.on('disconnect', () => {
  console.log('Disconnected from server');
  this.emit('socketDisconnected');
  
  // Show offline indicator
  showOfflineMessage();
});

this.socket.on('reconnect', () => {
  console.log('Reconnected to server');
  this.emit('socketConnected');
  
  // Refresh data
  reloadData();
});

this.socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});
```

### Handle Connection Errors

```javascript
// Component
import { useEffect, useState } from 'react';
import { socketService } from '../services/socketService';

export function ConnectionStatus() {
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const unsubConnected = socketService.on('socketConnected', () => {
      setStatus('connected');
    });

    const unsubDisconnected = socketService.on('socketDisconnected', () => {
      setStatus('disconnected');
    });

    const unsubError = socketService.on('socketError', (error) => {
      setStatus('error');
      console.error('Socket error:', error);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubError();
    };
  }, []);

  return (
    <div className={`status status-${status}`}>
      {status === 'connected' && '🟢 Connected'}
      {status === 'disconnected' && '🔴 Disconnected'}
      {status === 'connecting' && '🟡 Connecting...'}
      {status === 'error' && '⚠️ Connection Error'}
    </div>
  );
}
```

---

## 🧪 Testing Real-Time Features

### Step 1: Set Up Test Environment

1. Start backend: `npm run dev` (in `dev-thread-backend`)
2. Start frontend: `npm run dev` (in frontend)
3. Open 2-3 browser tabs to the app

### Step 2: Test Each Feature

#### Test Live Posts
1. In Tab 1: Create a new post
2. Check Tab 2 & 3: Post appears immediately (no refresh needed)
3. Verify timestamp is current

#### Test Messages
1. In Tab 1: Open message with a user
2. In Tab 2: Open same conversation
3. Tab 1: Send message
4. Check Tab 2: Message appears instantly
5. Verify sender name and timestamp

#### Test Likes
1. In Tab 1: View a post
2. In Tab 2: Like the post
3. Check Tab 1: Like count updates immediately

#### Test Typing Indicator
1. In Tab 1: Open message input
2. In Tab 2: Open same conversation
3. Tab 1: Start typing
4. Check Tab 2: See "typing indicator"
5. Tab 1: Stop typing
6. Check Tab 2: Indicator disappears

#### Test Online Status
1. In Tab 1: Open any page
2. In Tab 2: Look for online indicator
3. Verify it shows online
4. Close Tab 1
5. Check Tab 2: Status changes to offline

### Step 3: Browser DevTools Testing

Open Developer Tools → Network → WS (WebSocket):

```
Expected WebSocket upgrades:
1. Initial HTTP connection
2. Upgrade to WebSocket
3. Socket ID assigned
4. Events flowing both directions
```

Monitor Console for:
```
✅ Socket connected: /socket-id
✅ Events being emitted and received
✅ No connection errors
```

### Step 4: Stress Test

Test with multiple concurrent connections:

```javascript
// In console of multiple tabs
// Tab 1
socketService.socketEmit('post:create', {
  content: 'Test from Tab 1'
});

// Tab 2
socketService.socketEmit('message:send', {
  recipientId: 'user_2',
  content: 'Hello from Tab 2'
});

// All tabs should receive events instantly
```

---

## 📊 Monitoring & Debugging

### View Connected Users (Backend Console)

Add to server startup:

```javascript
setInterval(() => {
  console.log('Connected users:', connectedUsers.size);
  console.log(Array.from(connectedUsers.entries()));
}, 10000); // Every 10 seconds
```

### View Socket Events (Frontend Console)

```javascript
// In socketService.js - add debugging
setupEventListeners() {
  if (!this.socket) return;

  const events = [
    'post:created', 'post:updated', 'post:deleted',
    'message:received', 'typing',
    'user:online', 'user:offline'
  ];

  events.forEach((event) => {
    this.socket.on(event, (data) => {
      console.log(`📨 Event received: ${event}`, data);
    });
  });
}
```

### Latency Testing

```javascript
// Frontend
const startTime = Date.now();
socketService.socketEmit('ping', {});

socketService.on('pong', () => {
  const latency = Date.now() - startTime;
  console.log(`Latency: ${latency}ms`);
});
```

---

## 🚀 Deployment Considerations

### Production Socket.IO Configuration

```javascript
// Use Redis for scaling across multiple servers
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});
```

### CORS for Production

```javascript
const io = new SocketIO(httpServer, {
  cors: {
    origin: [
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});
```

---

## ✅ Complete Feature Checklist

- [ ] Backend Socket.IO configured
- [ ] Frontend Socket.IO client connected
- [ ] Post creation broadcasts in real-time
- [ ] Messages send and receive instantly
- [ ] Likes/unlikes update in real-time
- [ ] Typing indicators show
- [ ] Online status works
- [ ] New stories broadcast
- [ ] Notifications appear
- [ ] Connection errors handled
- [ ] Reconnection works
- [ ] Multiple browser tabs sync data
- [ ] No console errors
- [ ] Tested with 2+ concurrent users

---

## 🎯 Next Steps

1. ✅ Configure backend Socket.IO
2. ✅ Set up frontend Socket service
3. ✅ Integrate in components
4. ✅ Test with multiple tabs
5. ➡️ Monitor performance
6. ➡️ Deploy to production

---

**Real-Time Communication Ready! 🚀**
