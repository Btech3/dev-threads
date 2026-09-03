# Frontend-Backend Integration Guide - Dev Thread

Complete end-to-end guide to connect your React frontend with the Node.js backend for real-time communication.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Service Layer Setup](#api-service-layer-setup)
3. [Real-Time Socket.IO Setup](#real-time-socketio-setup)
4. [Frontend Integration Steps](#frontend-integration-steps)
5. [Component-by-Component Integration](#component-by-component-integration)
6. [Real-Time Features Implementation](#real-time-features-implementation)
7. [Testing Integration](#testing-integration)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Current Frontend State
- ✅ 9 pages built with React
- ✅ Dummy data in `assets.js`
- ✅ Responsive design
- ✅ Clerk authentication
- ❌ No backend communication

### Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                           │
│  (React Components, State Management, UI)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────────────────────┐
              │   API Service Layer          │
              │  (Axios/Fetch Requests)      │
              │   Socket.IO Client           │
              └─────────────────────────────┘
                            ↓
          ┌──────────────────────────────────────┐
          │   HTTP + WebSocket                   │
          │   RESTful API + Real-Time Events     │
          └──────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  NODE.JS EXPRESS BACKEND                     │
│  - Routes, Controllers, Middleware                          │
│  - MongoDB Database                                         │
│  - Socket.IO Server (Real-time events)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Service Layer Setup

### Step 1: Create API Service File

Create `src/services/api.js`:

```javascript
// src/services/api.js
import axios from 'axios';

// Get backend URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to include Clerk ID in all requests
apiClient.interceptors.request.use((config) => {
  // Get Clerk ID from localStorage (set by Clerk)
  const clerkId = localStorage.getItem('clerkId');
  
  if (clerkId) {
    config.headers['X-Clerk-ID'] = clerkId;
  }
  
  return config;
});

// Handle response errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.error('Unauthorized - redirecting to login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Step 2: Create User API Methods

Create `src/services/userService.js`:

```javascript
// src/services/userService.js
import apiClient from './api.js';

export const userService = {
  // Get user profile
  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/users/profile/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      const response = await apiClient.put(`/users/profile/${userId}`, profileData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    try {
      const response = await apiClient.get('/users/search', {
        params: { q: query, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Get user stats
  getStats: async (userId) => {
    try {
      const response = await apiClient.get(`/users/stats/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};
```

### Step 3: Create Post API Methods

Create `src/services/postService.js`:

```javascript
// src/services/postService.js
import apiClient from './api.js';

export const postService = {
  // Get feed (all posts)
  getFeed: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/posts/feed', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  },

  // Create new post
  createPost: async (postData) => {
    try {
      const response = await apiClient.post('/posts', postData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Get single post
  getPost: async (postId) => {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const response = await apiClient.put(`/posts/${postId}`, postData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Like post
  likePost: async (postId) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Unlike post
  unlikePost: async (postId) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/unlike`);
      return response.data.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  // Add comment
  addComment: async (postId, text) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comment`, { text });
      return response.data.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    try {
      await apiClient.delete(`/posts/${postId}/comment/${commentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
};
```

### Step 4: Create Message API Methods

Create `src/services/messageService.js`:

```javascript
// src/services/messageService.js
import apiClient from './api.js';

export const messageService = {
  // Get all conversations
  getConversations: async () => {
    try {
      const response = await apiClient.get('/messages');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages with specific user
  getMessages: async (userId) => {
    try {
      const response = await apiClient.get(`/messages/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (recipientId, content, media = null) => {
    try {
      const messageData = { recipientId, content };
      if (media) messageData.media = media;
      
      const response = await apiClient.post('/messages', messageData);
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const response = await apiClient.put(`/messages/${messageId}/read`);
      return response.data.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
};
```

### Step 5: Create Connection API Methods

Create `src/services/connectionService.js`:

```javascript
// src/services/connectionService.js
import apiClient from './api.js';

export const connectionService = {
  // Follow user
  followUser: async (userId) => {
    try {
      const response = await apiClient.post(`/connections/${userId}/follow`);
      return response.data.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    try {
      const response = await apiClient.post(`/connections/${userId}/unfollow`);
      return response.data.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Get followers
  getFollowers: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/connections/followers', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  },

  // Get following
  getFollowing: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/connections/following', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  },

  // Get all connections
  getConnections: async () => {
    try {
      const response = await apiClient.get('/connections');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }
};
```

### Step 6: Create Story API Methods

Create `src/services/storyService.js`:

```javascript
// src/services/storyService.js
import apiClient from './api.js';

export const storyService = {
  // Create story
  createStory: async (storyData) => {
    try {
      const response = await apiClient.post('/stories', storyData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  // Get user stories
  getUserStories: async (userId) => {
    try {
      const response = await apiClient.get(`/stories/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  },

  // Get feed stories
  getFeedStories: async () => {
    try {
      const response = await apiClient.get('/stories/feed');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching feed stories:', error);
      throw error;
    }
  },

  // Delete story
  deleteStory: async (storyId) => {
    try {
      await apiClient.delete(`/stories/${storyId}`);
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
};
```

---

## 🔌 Real-Time Socket.IO Setup

### Step 1: Install Socket.IO Client

```bash
npm install socket.io-client
```

### Step 2: Create Socket Service

Create `src/services/socketService.js`:

```javascript
// src/services/socketService.js
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
```

---

## 🔗 Frontend Integration Steps

### Step 1: Update Environment Variables

Create `.env` file in frontend:

```env
# .env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
```

Update `vite.config.js`:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

### Step 2: Create Context for Global State

Create `src/context/AppContext.jsx`:

```javascript
// src/context/AppContext.jsx
                                                                                                                                                                                                                      
Update `src/main.jsx`:

```javascript
// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <AppProvider>
        <App />
      </AppProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
```

---

## 🎯 Component-by-Component Integration

### Feed Page Integration

Update `src/pages/feed.jsx`:

```javascript
// src/pages/feed.jsx (UPDATED)
import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/loading';

export default function Feed() {
  const { posts, setPosts, isLoading, setIsLoading, isOnline } = useApp();
  const [page, setPage] = useState(1);

  // Fetch feed on component mount
  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const data = await postService.getFeed(page, 10);
      setPosts(data.data);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="feed-container">
      {/* Status indicator */}
      <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Live' : '🔴 Offline'}
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onUpdate={fetchFeed} />
      ))}
    </div>
  );
}
```

### Message Page Integration

Update `src/pages/message.jsx`:

```javascript
// src/pages/message.jsx (UPDATED)
import { useState, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { socketService } from '../services/socketService';
import { useApp } from '../context/AppContext';

export default function Message() {
  const { user } = useApp();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = socketService.on('messageReceived', (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setMessages((prev) => [...prev, data]);
      }
    });
    return unsubscribe;
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const selectUser = async (conversation) => {
    setSelectedUser(conversation.recipient);
    try {
      const msgs = await messageService.getMessages(conversation.recipientId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedUser) return;

    try {
      const newMessage = await messageService.sendMessage(selectedUser._id, inputMessage);
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage('');
      
      // Emit via socket for real-time delivery
      socketService.socketEmit('message:send', {
        recipientId: selectedUser._id,
        content: inputMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="message-container">
      <div className="conversations">
        {conversations.map((conv) => (
          <div
            key={conv._id}
            onClick={() => selectUser(conv)}
            className={`conversation ${selectedUser?._id === conv.recipientId ? 'active' : ''}`}
          >
            <img src={conv.recipient.profile_picture} alt={conv.recipient.full_name} />
            <div>
              <h3>{conv.recipient.full_name}</h3>
              <p>{conv.lastMessage}</p>
            </div>
            {conv.unreadCount > 0 && <span className="unread">{conv.unreadCount}</span>}
          </div>
        ))}
      </div>

      {selectedUser && (
        <div className="message-thread">
          <div className="messages">
            {messages.map((msg) => (
              <div key={msg._id} className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                <p>{msg.content}</p>
                <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
              </div>
            ))}
          </div>
          <div className="input-area">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Profile Page Integration

Update `src/pages/profile.jsx`:

```javascript
// src/pages/profile.jsx (UPDATED)
import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { connectionService } from '../services/connectionService';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { user } = useApp();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState(null);

  // Fetch profile data on mount
  useEffect(() => {
    if (user?.id) {
      fetchProfileData(user.id);
    }
  }, [user]);

  const fetchProfileData = async (userId) => {
    try {
      const profileData = await userService.getProfile(userId);
      const statsData = await userService.getStats(userId);
      const feedData = await postService.getFeed();
      
      setProfile(profileData);
      setStats(statsData);
      
      // Filter posts by user
      const userPostsData = feedData.data.filter((p) => p.userId === userId);
      setUserPosts(userPostsData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleFollowClick = async () => {
    try {
      if (isFollowing) {
        await connectionService.unfollowUser(profile._id);
      } else {
        await connectionService.followUser(profile._id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      {/* Cover photo and profile info */}
      <div className="profile-header">
        <img src={profile.cover_photo} alt="Cover" className="cover-photo" />
        <div className="profile-info">
          <img src={profile.profile_picture} alt="Profile" className="profile-pic" />
          <h1>{profile.full_name}</h1>
          <p>@{profile.username}</p>
          <p>{profile.bio}</p>
          <button onClick={handleFollowClick} className="follow-btn">
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats">
          <div>
            <strong>{stats.followers_count}</strong>
            <p>Followers</p>
          </div>
          <div>
            <strong>{stats.following_count}</strong>
            <p>Following</p>
          </div>
          <div>
            <strong>{stats.posts_count}</strong>
            <p>Posts</p>
          </div>
        </div>
      )}

      {/* User posts */}
      <div className="user-posts">
        {userPosts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

### Connection Page Integration

Update `src/pages/connection.jsx`:

```javascript
// src/pages/connection.jsx (UPDATED)
import { useState, useEffect } from 'react';
import { connectionService } from '../services/connectionService';
import { socketService } from '../services/socketService';

export default function Connection() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('followers');

  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers();
    } else {
      fetchFollowing();
    }
  }, [activeTab]);

  // Listen for follow/unfollow events
  useEffect(() => {
    const unsubFollow = socketService.on('userFollowed', (data) => {
      setFollowers((prev) => [data, ...prev]);
    });

    const unsubUnfollow = socketService.on('userUnfollowed', (data) => {
      setFollowers((prev) => prev.filter((f) => f._id !== data._id));
    });

    return () => {
      unsubFollow();
      unsubUnfollow();
    };
  }, []);

  const fetchFollowers = async () => {
    try {
      const data = await connectionService.getFollowers();
      setFollowers(data.data);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const data = await connectionService.getFollowing();
      setFollowing(data.data);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  return (
    <div className="connection-container">
      <div className="tabs">
        <button
          className={activeTab === 'followers' ? 'active' : ''}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({followers.length})
        </button>
        <button
          className={activeTab === 'following' ? 'active' : ''}
          onClick={() => setActiveTab('following')}
        >
          Following ({following.length})
        </button>
      </div>

      <div className="users-list">
        {(activeTab === 'followers' ? followers : following).map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>
    </div>
  );
}
```

---

## ⚡ Real-Time Features Implementation

### Real-Time Post Creation

In `Feed` component:

```javascript
useEffect(() => {
  const unsubscribe = socketService.on('postCreated', (newPost) => {
    // Add new post to top of feed
    setPosts((prev) => [newPost, ...prev]);
    
    // Show notification
    addNotification(`${newPost.user.full_name} posted something new!`);
  });

  return unsubscribe;
}, []);
```

### Real-Time Like/Unlike

In `PostCard` component:

```javascript
const handleLike = async () => {
  try {
    const result = await postService.likePost(post._id);
    
    // Update UI immediately
    setPost((prev) => ({
      ...prev,
      likes_count: result.likes_count,
      isLiked: result.isLiked
    }));

    // Emit via socket for real-time
    socketService.socketEmit('post:like', {
      postId: post._id,
      userId: user.id
    });
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

// Listen for other users' likes
useEffect(() => {
  const unsubscribe = socketService.on('postLiked', (data) => {
    if (data.postId === post._id && data.userId !== user.id) {
      setPost((prev) => ({
        ...prev,
        likes_count: prev.likes_count + 1
      }));
    }
  });

  return unsubscribe;
}, [post._id, user.id]);
```

### Real-Time Typing Indicator

In `Message` component:

```javascript
const handleTyping = (e) => {
  setInputMessage(e.target.value);
  
  // Emit typing event
  socketService.socketEmit('typing', {
    recipientId: selectedUser._id,
    isTyping: true
  });
};

// Listen for typing indicator
useEffect(() => {
  const unsubscribe = socketService.on('typing', (data) => {
    if (data.senderId === selectedUser?._id) {
      setIsTyping(data.isTyping);
    }
  });

  return unsubscribe;
}, [selectedUser]);
```

---

## ✅ Testing Integration

### Step 1: Test Backend

1. Start backend:
```bash
cd dev-thread-backend
npm run dev
```

2. Verify endpoints in Postman (see [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md))

### Step 2: Test Frontend Connection

1. Start frontend:
```bash
npm run dev
```

2. Open browser console (F12)
3. Check for connection messages:
```
Socket connected: /socket-id
```

### Step 3: Test Each Feature

**Create Post**:
- [ ] Frontend form submits
- [ ] Backend receives and saves to DB
- [ ] Feed updates in real-time
- [ ] Other users see it immediately

**Send Message**:
- [ ] Message sends via API
- [ ] Appears in sender's chat
- [ ] Recipient receives real-time notification
- [ ] Message appears in recipient's chat

**Like Post**:
- [ ] Like count updates immediately
- [ ] Other users see like in real-time
- [ ] Like persists after page reload

### Step 4: Check Network Tab

In browser DevTools:
1. Open Network tab
2. Filter by "Fetch/XHR"
3. Create post and verify request:
   - Method: POST
   - URL: `/api/posts`
   - Headers: `X-Clerk-ID` present
   - Status: 201 Created

4. Check WebSocket tab:
   - Should see Socket.IO connection
   - Messages being sent/received

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized Errors

**Problem**: All API requests return 401

**Solution**:
```javascript
// Check localStorage has Clerk ID
console.log(localStorage.getItem('clerkId'));

// Verify in network request headers
// Should include: X-Clerk-ID: user_...
```

### Issue: CORS Errors

**Problem**: `Access to XMLHttpRequest blocked by CORS`

**Solution** (in backend `server.js`):
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Clerk-ID']
}));
```

### Issue: Socket.IO Not Connecting

**Problem**: `socketConnected` event never fires

**Solution**:
```javascript
// Check backend has Socket.IO configured
// In server.js, should have:
import { Server as SocketIO } from 'socket.io';
const io = new SocketIO(httpServer, {
  cors: { origin: 'http://localhost:5173' }
});

// Check frontend Socket.IO URL is correct
const SOCKET_URL = 'http://localhost:5000'; // Not /api
```

### Issue: Data Not Syncing Real-Time

**Problem**: Create post, don't see on other users' feeds

**Solution**:
1. Check Socket.IO is connected for both users
2. Verify server is emitting events:
   ```javascript
   io.emit('post:created', newPost);
   ```
3. Verify frontend is listening:
   ```javascript
   socketService.on('postCreated', (data) => {...})
   ```

### Issue: Images Not Uploading

**Problem**: Image URLs are empty

**Solution**:
- Verify ImageKit configuration
- Or use dummy image URLs for testing:
  ```javascript
  media: ['https://via.placeholder.com/600x400']
  ```

---

## 📊 Performance Optimization

### 1. Pagination for Feed
```javascript
const [page, setPage] = useState(1);

const loadMore = async () => {
  const newPage = page + 1;
  const moreData = await postService.getFeed(newPage);
  setPosts((prev) => [...prev, ...moreData.data]);
  setPage(newPage);
};
```

### 2. Image Lazy Loading
```javascript
<img
  src={post.media[0]}
  loading="lazy"
  alt="Post media"
/>
```

### 3. Debounce Search
```javascript
import { debounce } from 'lodash';

const handleSearch = debounce(async (query) => {
  const results = await userService.searchUsers(query);
  setSearchResults(results);
}, 300);
```

---

## 🎯 Next Steps

1. ✅ [Set up API Services](#api-service-layer-setup)
2. ✅ [Connect Socket.IO](#real-time-socketio-setup)
3. ✅ [Update Components](#component-by-component-integration)
4. ✅ [Test End-to-End](#testing-integration)
5. ➡️ Deploy to production

---

**Happy Integrating! 🚀**
