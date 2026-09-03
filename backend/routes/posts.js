// routes/posts.js
/**
 * @swagger
 * tags:
 *   - name: Posts
 *     description: Post creation, retrieval, and management endpoints
 *   - name: Engagements
 *     description: Real-time engagement endpoints (like, comment, share, bookmark)
 * 
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB User ID
 *         full_name:
 *           type: string
 *         username:
 *           type: string
 *         profile_picture:
 *           type: string
 *           format: url
 *         email:
 *           type: string
 *           format: email
 * 
 *     Comment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           $ref: '#/components/schemas/User'
 *         text:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     Post:
 *       type: object
 *       description: Social media post with engagement metrics
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB Post ID
 *         userId:
 *           $ref: '#/components/schemas/User'
 *         content:
 *           type: string
 *           description: Post text content (1-5000 characters)
 *         media:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, video, document]
 *               url:
 *                 type: string
 *                 format: url
 *               mimetype:
 *                 type: string
 *               size:
 *                 type: integer
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who liked this post
 *         likeCount:
 *           type: integer
 *           description: Total count of likes
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         commentCount:
 *           type: integer
 *           description: Total count of comments
 *         shares:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               sharedAt:
 *                 type: string
 *                 format: date-time
 *         shareCount:
 *           type: integer
 *           description: Total count of shares
 *         bookmarks:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who bookmarked this post
 *         bookmarkCount:
 *           type: integer
 *           description: Total count of bookmarks
 *         isEdited:
 *           type: boolean
 *         editedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: "Bearer token. Pass 'Authorization: Bearer <token>' in headers. Include 'x-clerk-id' header with Clerk ID."
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { verifyClerkToken } from '../middleware/auth.js';
import {
  getFeed,
  createPost,
  getPost,
  updatePost,
  deletePost,
  getUserPosts,
  likePost,
  unlikePost,
  commentPost,
  deleteComment,
  replyToComment,
  reactToComment,
  sharePost,
  unsharePost,
  bookmarkPost,
  removeBookmark,
  getPostStatus
} from '../controllers/postController.js';

const router = express.Router();

/**
 * Configure Multer for post media uploads
 * 
 * Storage: Disk storage in ./uploads directory
 * File size limit: 10MB per file
 * Max files: 5 per request
 * Supported formats: 
 *   - Images: jpg, jpeg, png, gif, webp
 *   - Videos: mp4, webm, mov
 *   - Documents: pdf, docx, doc
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/posts');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    // Accept both images and videos
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  }
});

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     operationId: getFeedPosts
 *     summary: Get paginated feed posts
 *     description: Retrieve posts from followed users and own posts with pagination
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Posts per page (max 50)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for personalized feed
 *     responses:
 *       200:
 *         description: Successfully retrieved feed with pagination
 *     x-codegen-request-body-name: body
 */
router.get('/feed', getFeed);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     operationId: createNewPost
 *     summary: Create a new post with optional media
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Post created successfully. Broadcasts to 'feed' room via Socket.io.
 *       400:
 *         description: Validation error
 *       413:
 *         description: File too large
 *       500:
 *         description: Server error
 */
router.post('/', verifyClerkToken, upload.array('media', 5), createPost);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     operationId: getUserPosts
 *     summary: Get posts for a specific user
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to retrieve posts for
 */
router.get('/user/:userId', getUserPosts);

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     operationId: getSinglePost
 *     tags:
 *       - Posts
 */
router.get('/:postId', getPost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     operationId: updateExistingPost
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 */
router.put('/:postId', verifyClerkToken, updatePost);

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     operationId: deleteExistingPost
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:postId', verifyClerkToken, deletePost);

// ============================================
// ENGAGEMENT ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     operationId: likeAPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.post('/:postId/like', verifyClerkToken, likePost);

/**
 * @swagger
 * /api/posts/{postId}/unlike:
 *   post:
 *     operationId: unlikeAPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.post('/:postId/unlike', verifyClerkToken, unlikePost);

/**
 * @swagger
 * /api/posts/{postId}/comment:
 *   post:
 *     operationId: addCommentToPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.post('/:postId/comment', verifyClerkToken, commentPost);
router.post('/:postId/comment/:commentId/reply', verifyClerkToken, replyToComment);
router.post('/:postId/comment/:commentId/react', verifyClerkToken, reactToComment);

/**
 * @swagger
 * /api/posts/{postId}/comment/{commentId}:
 *   delete:
 *     operationId: deleteCommentFromPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:postId/comment/:commentId', verifyClerkToken, deleteComment);

/**
 * @swagger
 * /api/posts/{postId}/share:
 *   post:
 *     operationId: shareAPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.post('/:postId/share', verifyClerkToken, sharePost);

// Unshare endpoint (toggles share)
router.post('/:postId/unshare', verifyClerkToken, unsharePost);

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   post:
 *     operationId: bookmarkAPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.post('/:postId/bookmark', verifyClerkToken, bookmarkPost);

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   delete:
 *     operationId: removeBookmarkFromPost
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:postId/bookmark', verifyClerkToken, removeBookmark);

/**
 * @swagger
 * /api/posts/{postId}/status:
 *   get:
 *     operationId: getPostEngagementStatus
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 */
router.get('/:postId/status', verifyClerkToken, getPostStatus);

export default router;