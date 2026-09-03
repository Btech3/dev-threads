# Backend Setup Guide - Dev Thread

Complete guide to set up the backend for the Dev Thread social media platform.

---

## 🎯 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- MongoDB Atlas account (or local MongoDB)
- Clerk account with API keys
- Git for version control

### 1. Create Backend Project Structure

```bash
# Create backend directory
mkdir dev-thread-backend
cd dev-thread-backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express cors dotenv mongodb mongoose axios nodemon
npm install --save-dev eslint prettier
```

### 2. Install Dependencies

```bash
npm install \
  express \
  cors \
  dotenv \
  mongoose \
  mongodb \
  axios \
  jsonwebtoken \
  bcryptjs \
  multer \
  socket.io \
  socket.io-client

npm install --save-dev \
  nodemon \
  eslint \
  prettier
```

### 3. Project Structure

```
dev-thread-backend/
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Message.js
│   ├── Story.js
│   └── Connection.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── messages.js
│   ├── stories.js
│   └── connections.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   ├── messageController.js
│   ├── storyController.js
│   └── connectionController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validateRequest.js
├── config/
│   ├── database.js
│   └── clerk.js
├── utils/
│   ├── logger.js
│   └── errorHandler.js
├── .env.example
├── .env
├── server.js
├── package.json
└── README.md
```

---

## 📦 Environment Setup

### Create `.env` file

```env
# Server Config
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database - MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/dev-thread?retryWrites=true&w=majority
# OR Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/dev-thread

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# JWT (if using custom tokens)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# API Keys
API_SECRET=your_api_secret_key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

---

## 🗄️ Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account and free cluster
3. Create database user (Security → Database Access)
4. Add IP whitelist (Security → Network Access) - Add `0.0.0.0/0` for development
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.mongodb.net/dev-thread?retryWrites=true&w=majority
   ```
6. Add to `.env` as `MONGODB_URI`

### Local MongoDB

```bash
# Windows (using Windows Subsystem for Linux)
# Or install MongoDB Community Edition

# Start MongoDB
mongod

# Connection string
mongodb://localhost:27017/dev-thread
```

---

## 💾 Database Models

### User Model

```javascript
// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  full_name: String,
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  bio: String,
  profile_picture: String,
  cover_photo: String,
  location: String,
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  is_verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
```

### Post Model

```javascript
// models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  media: [{
    type: String,
    url: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Post', postSchema);
```

### Message Model

```javascript
// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: String,
  media_url: String,
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Message', messageSchema);
```

### Story Model

```javascript
// models/Story.js
import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: String,
  media_url: String,
  media_type: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'text'
  },
  background_color: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-delete expired stories
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Story', storySchema);
```

### Connection Model

```javascript
// models/Connection.js
import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate connections
connectionSchema.index({ userId: 1, targetUserId: 1 }, { unique: true });

export default mongoose.model('Connection', connectionSchema);
```

---

## 🔑 Middleware Setup

### Authentication Middleware

```javascript
// middleware/auth.js
import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.clerkId = decoded.clerkId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyClerkToken = async (req, res, next) => {
  try {
    const clerkId = req.headers['x-clerk-id'];
    if (!clerkId) {
      return res.status(401).json({ message: 'Clerk ID required' });
    }
    req.clerkId = clerkId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
```

### Error Handler Middleware

```javascript
// middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

---

## 🛣️ API Routes

### Authentication Routes

```javascript
// routes/auth.js
import express from 'express';
import { handleClerkWebhook, logout } from '../controllers/authController.js';

const router = express.Router();

// Clerk webhook for user sync
router.post('/webhook', handleClerkWebhook);

// Logout
router.post('/logout', logout);

export default router;
```

### User Routes

```javascript
// routes/users.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserStats
} from '../controllers/userController.js';

const router = express.Router();

router.get('/profile/:userId', getUserProfile);
router.put('/profile/:userId', verifyClerkToken, updateUserProfile);
router.get('/search', searchUsers);
router.get('/stats/:userId', getUserStats);

export default router;
```

### Post Routes

```javascript
// routes/posts.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  commentPost,
  deleteComment
} from '../controllers/postController.js';

const router = express.Router();

router.get('/feed', getFeed);
router.post('/', verifyClerkToken, createPost);
router.get('/:postId', getPost);
router.put('/:postId', verifyClerkToken, updatePost);
router.delete('/:postId', verifyClerkToken, deletePost);
router.post('/:postId/like', verifyClerkToken, likePost);
router.post('/:postId/unlike', verifyClerkToken, unlikePost);
router.post('/:postId/comment', verifyClerkToken, commentPost);
router.delete('/:postId/comment/:commentId', verifyClerkToken, deleteComment);

export default router;
```

### Message Routes

```javascript
// routes/messages.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/', verifyClerkToken, getConversations);
router.get('/:userId', verifyClerkToken, getMessages);
router.post('/', verifyClerkToken, sendMessage);
router.put('/:messageId/read', verifyClerkToken, markAsRead);
router.delete('/:messageId', verifyClerkToken, deleteMessage);

export default router;
```

### Connections Routes

```javascript
// routes/connections.js
import express from 'express';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getConnections,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  getPendingRequests,
  acceptRequest,
  rejectRequest
} from '../controllers/connectionController.js';

const router = express.Router();

router.get('/', verifyClerkToken, getConnections);
router.get('/followers', verifyClerkToken, getFollowers);
router.get('/following', verifyClerkToken, getFollowing);
router.post('/:userId/follow', verifyClerkToken, followUser);
router.post('/:userId/unfollow', verifyClerkToken, unfollowUser);
router.get('/pending', verifyClerkToken, getPendingRequests);
router.post('/:userId/accept', verifyClerkToken, acceptRequest);
router.post('/:userId/reject', verifyClerkToken, rejectRequest);

export default router;
```

---

## 🚀 Server Setup

### Main Server File

```javascript
// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import connectionRoutes from './routes/connections.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/connections', connectionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Socket.IO for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-chat', (userId) => {
    socket.join(`chat-${userId}`);
  });

  socket.on('send-message', (message) => {
    io.to(`chat-${message.recipientId}`).emit('receive-message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error Handling
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 CORS enabled for: ${process.env.FRONTEND_URL}`);
});

export { io };
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "build": "echo 'No build needed for Node backend'",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "type": "module"
}
```

---

## 🔐 Clerk Webhook Setup

### 1. Configure Webhook in Clerk Dashboard

- Go to [Clerk Dashboard](https://dashboard.clerk.com)
- Select your application
- Navigate to **Webhooks** (in Developers section)
- Create new webhook endpoint:
  - URL: `https://your-backend-domain/api/auth/webhook`
  - Events: `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing Secret** to `.env` as `CLERK_WEBHOOK_SECRET`

### 2. Webhook Handler Controller

```javascript
// controllers/authController.js
import User from '../models/User.js';
import { Webhook } from 'svix';

export const handleClerkWebhook = async (req, res) => {
  try {
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(JSON.stringify(req.body), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    });

    const { id, type, data } = evt;

    if (type === 'user.created' || type === 'user.updated') {
      const user = await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          clerkId: data.id,
          email: data.email_addresses[0]?.email_address,
          full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          username: data.username || data.email_addresses[0]?.email_address.split('@')[0],
          profile_picture: data.image_url
        },
        { upsert: true, new: true }
      );
      console.log('✅ User synced:', user.email);
    }

    if (type === 'user.deleted') {
      await User.deleteOne({ clerkId: data.id });
      console.log('✅ User deleted');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
};

export const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};
```

---

## 🧪 Testing the Backend

### Using Postman or cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Create post (requires auth)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "x-clerk-id: user_xxx" \
  -d '{"content":"Hello World"}'

# Get feed
curl http://localhost:5000/api/posts/feed

# Search users
curl http://localhost:5000/api/users/search?q=john
```

---

## 🚀 Deployment

### Deploy on Heroku

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set CLERK_SECRET_KEY=your_clerk_secret
heroku config:set FRONTEND_URL=https://your-frontend-domain

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Deploy on Railway/Render

1. Connect GitHub repository
2. Add build command: `npm install`
3. Add start command: `npm start`
4. Add environment variables
5. Deploy

### Deploy on AWS/DigitalOcean

Use Docker:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Clerk Documentation](https://clerk.com/docs)
- [Socket.IO Documentation](https://socket.io/docs/)

---

## ✅ Checklist Before Production

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] Clerk webhook configured and tested
- [ ] CORS properly configured for frontend domain
- [ ] Error handling and logging implemented
- [ ] Rate limiting added
- [ ] Input validation implemented
- [ ] Security headers added
- [ ] API documentation complete
- [ ] Load testing done
- [ ] SSL/HTTPS enabled
- [ ] Monitoring and alerting set up
