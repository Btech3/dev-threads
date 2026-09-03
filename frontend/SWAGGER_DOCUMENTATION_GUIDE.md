# Swagger Documentation Guide - Dev Thread Backend

Complete step-by-step guide to set up and configure Swagger API documentation for the Dev Thread backend.

---

## 📋 Table of Contents

1. [What is Swagger?](#what-is-swagger)
2. [Installation & Setup](#installation--setup)
3. [Configure Swagger](#configure-swagger)
4. [Document Endpoints](#document-endpoints)
5. [API Documentation Examples](#api-documentation-examples)
6. [Running Swagger UI](#running-swagger-ui)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 📚 What is Swagger?

**Swagger** (OpenAPI) is an industry standard for API documentation that:
- ✅ Auto-generates interactive API docs
- ✅ Allows testing endpoints directly in browser
- ✅ Creates beautiful, shareable documentation
- ✅ Generates client code automatically
- ✅ Keeps docs in sync with code

**Default URL**: `http://localhost:5000/api-docs`

---

## 🛠️ Installation & Setup

### Step 1: Verify Dependencies

Swagger packages are already in your `package.json`. Verify:

```bash
npm list swagger-jsdoc swagger-ui-express
```

Should show:
```
├── swagger-jsdoc@6.3.0
└── swagger-ui-express@5.0.1
```

If missing, install:
```bash
npm install swagger-jsdoc swagger-ui-express
```

### Step 2: Update `server.js`

Add Swagger imports and configuration:

```javascript
// server.js
import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

dotenv.config();

const app = express();

// ============================================
// SWAGGER CONFIGURATION
// ============================================

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Dev Thread Social Media API',
    version: '1.0.0',
    description: 'Complete REST API for Dev Thread social media platform',
    contact: {
      name: 'Dev Thread Team',
      email: 'support@devthread.com',
      url: 'https://devthread.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
      variables: {
        protocol: {
          default: 'http'
        },
        host: {
          default: 'localhost:5000'
        }
      }
    },
    {
      url: 'https://api.devthread.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      ClerkAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Clerk-ID',
        description: 'Clerk User ID from authentication'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token authentication'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['_id', 'email', 'clerkId'],
        properties: {
          _id: {
            type: 'string',
            description: 'User unique identifier',
            example: 'user_2zdFoZib5lNr614LgkONdD8WG32'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'admin@example.com'
          },
          clerkId: {
            type: 'string',
            description: 'Clerk ID from authentication',
            example: 'user_2zdFoZib5lNr614LgkONdD8WG32'
          },
          full_name: {
            type: 'string',
            description: 'User full name',
            example: 'John Warren'
          },
          username: {
            type: 'string',
            description: 'Unique username',
            example: 'john_warren'
          },
          bio: {
            type: 'string',
            description: 'User bio/about section',
            example: 'Dreamer | Learner | Doer'
          },
          profile_picture: {
            type: 'string',
            format: 'uri',
            description: 'URL to user profile picture',
            example: 'https://images.unsplash.com/...'
          },
          cover_photo: {
            type: 'string',
            format: 'uri',
            description: 'URL to user cover photo',
            example: 'https://images.unsplash.com/...'
          },
          location: {
            type: 'string',
            description: 'User location',
            example: 'New York, NY'
          },
          followers: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of follower user IDs',
            example: ['user_2', 'user_3']
          },
          following: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of following user IDs',
            example: ['user_2', 'user_3']
          },
          is_verified: {
            type: 'boolean',
            description: 'Is user verified',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation date',
            example: '2025-07-09T09:26:59.231Z'
          }
        }
      },
      Post: {
        type: 'object',
        required: ['_id', 'userId', 'content'],
        properties: {
          _id: {
            type: 'string',
            description: 'Post unique identifier',
            example: '68773e977db16954a783839c'
          },
          userId: {
            type: 'string',
            description: 'ID of post creator',
            example: 'user_2zdFoZib5lNr614LgkONdD8WG32'
          },
          user: {
            $ref: '#/components/schemas/User'
          },
          content: {
            type: 'string',
            description: 'Post text content',
            example: 'We\'re a small team with a big vision'
          },
          media: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            description: 'Array of image/video URLs',
            example: ['https://images.pexels.com/...']
          },
          likes_count: {
            type: 'integer',
            description: 'Number of likes',
            example: 45
          },
          comments_count: {
            type: 'integer',
            description: 'Number of comments',
            example: 12
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-16T05:54:31.191Z'
          }
        }
      },
      Message: {
        type: 'object',
        required: ['_id', 'senderId', 'recipientId', 'content'],
        properties: {
          _id: {
            type: 'string',
            example: 'msg_1'
          },
          senderId: {
            type: 'string',
            example: 'user_2zdFoZib5lNr614LgkONdD8WG32'
          },
          recipientId: {
            type: 'string',
            example: 'user_2'
          },
          content: {
            type: 'string',
            example: 'Hey, how are you?'
          },
          media_url: {
            type: 'string',
            format: 'uri'
          },
          isRead: {
            type: 'boolean',
            example: false
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2025-07-25T10:35:00.000Z'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message here'
          },
          status: {
            type: 'integer',
            example: 400
          }
        }
      }
    }
  }
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 1
  }
}));

// ============================================
// REST OF SERVER CODE
// ============================================

app.use(cors());
app.use(express.json());

// ... rest of your server code

export default app;
```

---

## 📝 Configure Swagger in Route Files

Document your endpoints using JSDoc comments. Here's the pattern:

### Example: User Routes with Swagger

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

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve detailed profile information for a specific user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (Clerk ID)
 *         example: user_2zdFoZib5lNr614LgkONdD8WG32
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/profile/:userId', getUserProfile);

/**
 * @swagger
 * /api/users/profile/{userId}:
 *   put:
 *     summary: Update user profile
 *     description: Update user profile information (authenticated users only)
 *     tags:
 *       - Users
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: John Warren Updated
 *               bio:
 *                 type: string
 *                 example: Updated bio
 *               location:
 *                 type: string
 *                 example: Los Angeles, CA
 *               profile_picture:
 *                 type: string
 *                 format: uri
 *                 example: https://...
 *               cover_photo:
 *                 type: string
 *                 format: uri
 *                 example: https://...
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - X-Clerk-ID required
 *       404:
 *         description: User not found
 */
router.put('/profile/:userId', verifyClerkToken, updateUserProfile);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     description: Search for users by name or username
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: john
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/search', searchUsers);

/**
 * @swagger
 * /api/users/stats/{userId}:
 *   get:
 *     summary: Get user statistics
 *     description: Get user statistics including followers, following, posts count
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers_count:
 *                       type: integer
 *                       example: 245
 *                     following_count:
 *                       type: integer
 *                       example: 128
 *                     posts_count:
 *                       type: integer
 *                       example: 42
 *                     stories_count:
 *                       type: integer
 *                       example: 6
 */
router.get('/stats/:userId', getUserStats);

export default router;
```

---

## 📝 Document Post Endpoints

### Example: Post Routes with Swagger

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

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get feed (all posts)
 *     description: Retrieve paginated posts from followed users
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 */
router.get('/feed', getFeed);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with text and/or media
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post text content
 *                 example: This is my new post! 🚀
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of media URLs
 *                 example: []
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload image/video files
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request data
 */
router.post('/', verifyClerkToken, createPost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get single post
 *     description: Retrieve a specific post with all comments
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:postId', getPost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update post
 *     description: Update post content
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated
 *       401:
 *         description: Unauthorized or not post owner
 *       404:
 *         description: Post not found
 */
router.put('/:postId', verifyClerkToken, updatePost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete post
 *     description: Delete a post (only by post owner)
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.delete('/:postId', verifyClerkToken, deletePost);

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     description: Add current user's like to a post
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     likes_count:
 *                       type: integer
 *                     isLiked:
 *                       type: boolean
 */
router.post('/:postId/like', verifyClerkToken, likePost);

/**
 * @swagger
 * /api/posts/{postId}/unlike:
 *   post:
 *     summary: Unlike a post
 *     description: Remove current user's like from a post
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post unliked
 */
router.post('/:postId/unlike', verifyClerkToken, unlikePost);

/**
 * @swagger
 * /api/posts/{postId}/comment:
 *   post:
 *     summary: Add comment to post
 *     description: Add a new comment to a post
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Great post!
 *     responses:
 *       201:
 *         description: Comment added
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/comment', verifyClerkToken, commentPost);

/**
 * @swagger
 * /api/posts/{postId}/comment/{commentId}:
 *   delete:
 *     summary: Delete comment from post
 *     description: Remove a comment from a post
 *     tags:
 *       - Posts
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         description: Unauthorized
 */
router.delete('/:postId/comment/:commentId', verifyClerkToken, deleteComment);

export default router;
```

---

## 📝 Document Message Endpoints

```javascript
// routes/messages.js
/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get conversations
 *     description: Get list of all conversations for current user
 *     tags:
 *       - Messages
 *     security:
 *       - ClerkAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       recipient:
 *                         $ref: '#/components/schemas/User'
 *                       lastMessage:
 *                         type: string
 *                       unreadCount:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/messages/{userId}:
 *   get:
 *     summary: Get messages with user
 *     description: Get message history with a specific user
 *     tags:
 *       - Messages
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send message
 *     description: Send a message to another user
 *     tags:
 *       - Messages
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *                 example: user_2
 *               content:
 *                 type: string
 *                 example: Hey, how are you?
 *     responses:
 *       201:
 *         description: Message sent
 *       401:
 *         description: Unauthorized
 */
```

---

## 🔧 Swagger Configuration Options

Add to `server.js` for custom Swagger UI:

```javascript
const swaggerUiOptions = {
  // Keep authorization data across page reloads
  persistAuthorization: true,
  
  // Show all endpoints collapsed (don't expand by default)
  docExpansion: 'none',
  
  // Show/hide models dropdown
  defaultModelsExpandDepth: 1,
  
  // Custom CSS
  customCss: '.swagger-ui .topbar { display: none }',
  
  // Show authorization button in UI
  swaggerOptions: {
    showRequestHeaders: true,
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
  }
};

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
```

---

## ✅ Best Practices

### 1. **Use Consistent Tags**
Group endpoints by resource:
```javascript
tags:
  - Users
  - Posts
  - Messages
  - Connections
  - Stories
```

### 2. **Document All Parameters**
```javascript
parameters:
  - in: path        // in: path, query, header, cookie
    name: userId
    required: true
    schema:
      type: string
    description: User ID
    example: user_2zdFoZib5lNr614LgkONdD8WG32
```

### 3. **Specify Response Codes**
```javascript
responses:
  200:
    description: Success
  201:
    description: Created
  400:
    description: Bad request
  401:
    description: Unauthorized
  404:
    description: Not found
  500:
    description: Server error
```

### 4. **Use Reusable Schemas**
Define common schemas in `server.js`:
```javascript
components:
  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
        message:
          type: string
```

Then reference:
```javascript
$ref: '#/components/schemas/Error'
```

### 5. **Document Security**
```javascript
security:
  - ClerkAuth: []    // Requires X-Clerk-ID header
```

---

## 🚀 Running Swagger UI

### Step 1: Start Backend
```bash
cd dev-thread-backend
npm run dev
```

### Step 2: Open Browser
Navigate to: `http://localhost:5000/api-docs`

You should see:
- All endpoints listed
- Test interface for each endpoint
- Authorization button (top right)
- Full documentation

### Step 3: Set Authorization
1. Click the "Authorize" button (🔒)
2. Paste your Clerk ID: `user_2zdFoZib5lNr614LgkONdD8WG32`
3. Click "Authorize"
4. Now all requests will include `X-Clerk-ID` header

### Step 4: Test Endpoints
1. Click on any endpoint
2. Click "Try it out"
3. Fill in parameters (if needed)
4. Click "Execute"
5. See response in "Response" section

---

## 🔗 Export Swagger Spec

### Export as JSON
```http
GET http://localhost:5000/api-docs/swagger.json
```

### Use in Postman
1. Download swagger.json
2. In Postman: Collections → Import → Upload swagger.json
3. Automatically creates collection with all endpoints

### Generate Client Code
Use online tools:
- https://editor.swagger.io/
- Upload your swagger.json
- Generate → Choose language (JavaScript, Python, etc.)

---

## 🐛 Troubleshooting

### Issue: Swagger UI not loading

**Solution**:
```javascript
// Ensure swagger UI is imported
import swaggerUi from 'swagger-ui-express';

// Swagger routes come BEFORE other routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Then other routes
app.use('/api/users', userRoutes);
```

### Issue: Endpoints not showing up

**Solution**:
- Add JSDoc comments ABOVE route definition
- Use exact format: `@swagger`
- Ensure `apis: ['./routes/*.js']` in swaggerOptions
- Restart server

### Issue: Authorization not working

**Solution**:
```javascript
// Add security scheme to swagger definition
components: {
  securitySchemes: {
    ClerkAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-Clerk-ID'
    }
  }
}
```

### Issue: Can't test endpoints from Swagger

**Solution**:
- Ensure CORS is enabled in backend
- Check backend is running on correct port
- Verify `X-Clerk-ID` header is set via Authorize

---

## 📚 Complete Example: Full Routes File

See [complete route documentation examples](#) in this guide.

---

## 🎯 Next Steps

1. ✅ Add Swagger to all route files
2. ✅ Test in Swagger UI (`http://localhost:5000/api-docs`)
3. ✅ Export as OpenAPI spec
4. ✅ Share documentation with team
5. ➡️ [Follow Frontend Integration Guide](FRONTEND_BACKEND_INTEGRATION_GUIDE.md)

---

**Happy Documenting! 📚**
