
import Post from '../models/Post.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notifications.js';
import { getIO } from '../config/socket.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @swagger
 * /api/posts/feed:
 *   get:
 *     summary: Get feed posts (timeline)
 *     description: Retrieve posts from users you follow + your own posts with pagination
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for personalized feed
 *     responses:
 *       200:
 *         description: Successfully retrieved feed posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
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
 *                     pages:
 *                       type: integer
 *       500:
 *         description: Failed to retrieve feed posts
 */
export const getFeed = async (req, res) => {
  try {
    const { userId } = req.query; // Optional: get personalized feed
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // If userId provided, get personalized feed
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        query.userId = {
          $in: [...user.following, userId] // Posts from following + own
        };
      }
    }

    const posts = await Post.find(query)
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const posts = await Post.find({ userId })
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments({ userId });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to get user posts' });
  }
};

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post with optional media
 *     description: >
 *       Create a new post with optional multi-type file uploads (images, videos, documents).
 *       Supports multipart/form-data for seamless file handling.
 *       
 *       **File Upload Requirements:**
 *       - Max file size: 10MB per file
 *       - Supported formats: images (jpg, png, gif), videos (mp4, webm), documents (pdf)
 *       - Max files per post: 5
 *       - Field name: 'media' (array)
 *       
 *       **Post Requirements:**
 *       - Content: 1-5000 characters (required)
 *       - At least content or media must be provided
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
 *                 description: Post text content (1-5000 characters)
 *                 example: "Check out this amazing feature!"
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional media files (images, videos, documents)
 *             required:
 *               - content
 *           encoding:
 *             media:
 *               contentType: application/octet-stream
 *     responses:
 *       201:
 *         description: Post created successfully and broadcasted in real-time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post created successfully"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error - missing content or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Post content is required"
 *       413:
 *         description: File too large (max 10MB per file)
 *       500:
 *         description: Server error - database or file processing failure
 */
export const createPost = async (req, res) => {
  let uploadedFiles = [];
  
  try {
    const { content } = req.body;
    const userId = req.userId; // From auth middleware
    const files = req.files || []; // Multer populates this

    // ============================================
    // 1. VALIDATION LAYER
    // ============================================
    
    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({
        error: 'Post content is required',
        code: 'MISSING_CONTENT'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        error: 'Post exceeds maximum length of 5000 characters',
        code: 'CONTENT_TOO_LONG'
      });
    }

    // Validate that at least content exists
    if (content.trim().length === 0 && files.length === 0) {
      return res.status(400).json({
        error: 'Post must have either content or media',
        code: 'EMPTY_POST'
      });
    }

    // ============================================
    // 2. FILE PROCESSING LAYER
    // ============================================
    
    let mediaArray = [];

    if (files && files.length > 0) {
      // Validate number of files
      if (files.length > 5) {
        return res.status(400).json({
          error: 'Maximum 5 files per post',
          code: 'TOO_MANY_FILES'
        });
      }

      // Process each file
      for (const file of files) {
        try {
          const mediaItem = {
            type: getMediaType(file.mimetype),
            url: `/uploads/posts/${file.filename}`, // Serve via /uploads
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
          };
          
          mediaArray.push(mediaItem);
          uploadedFiles.push(file.path || file.filename);
          
          console.log(`✅ File processed: ${file.originalname} (${file.size} bytes)`);
        } catch (fileError) {
          console.error(`❌ File processing error for ${file.originalname}:`, fileError);
          throw new Error(`Failed to process file: ${file.originalname}`);
        }
      }
    }

    // ============================================
    // 3. DATABASE PERSISTENCE LAYER
    // ============================================

    const post = new Post({
      userId,
      content: content.trim(),
      media: mediaArray,
      likes: [],
      comments: [],
      shares: [],
      bookmarks: []
    });

    // Save to database
    await post.save();
    console.log(`✅ Post saved to database: ${post._id}`);

    // Populate user data for response
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'full_name profile_picture username email');

    // ============================================
    // 4. REAL-TIME BROADCAST LAYER
    // ============================================

    // Emit Socket.io event for real-time feed update
    try {
      const io = getIO();
      
      // Broadcast to all connected clients in 'feed' room
      io.to('feed').emit('post:created', {
        postId: post._id,
        action: 'post_created',
        createdBy: {
          userId: populatedPost.userId._id,
          full_name: populatedPost.userId.full_name,
          profile_picture: populatedPost.userId.profile_picture,
          username: populatedPost.userId.username
        },
        post: populatedPost,
        timestamp: new Date().toISOString()
      });

      console.log(`📡 Real-time broadcast: New post created by ${populatedPost.userId.username} (${post._id})`);
    } catch (socketError) {
      // Non-blocking: Log but don't fail the response
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    // ============================================
    // 5. NOTIFICATION LAYER
    // ============================================

    // Trigger INNGEST event for post creation workflows (if configured)
    if (process.env.INNGEST_EVENT_KEY) {
      try {
        await fetch('https://inn.gs/m/post.created', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.INNGEST_EVENT_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            postId: post._id,
            content: content.substring(0, 100),
            mediaCount: mediaArray.length
          })
        }).catch(err => console.warn('INNGEST event warning:', err.message));
      } catch (inngestError) {
        console.warn('INNGEST integration warning:', inngestError.message);
      }
    }

    // ============================================
    // 6. SUCCESS RESPONSE
    // ============================================

    res.status(201).json({
      message: 'Post created successfully',
      success: true,
      post: populatedPost,
      data: populatedPost,
      mediaCount: mediaArray.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // ============================================
    // 7. ERROR HANDLING & CLEANUP
    // ============================================

    console.error('❌ Post creation error:', error);

    // Clean up uploaded files on error
    for (const filePath of uploadedFiles) {
      try {
        await fs.unlink(filePath);
        console.log(`🧹 Cleaned up failed upload: ${filePath}`);
      } catch (cleanupError) {
        console.warn(`Warning: Could not delete file ${filePath}:`, cleanupError.message);
      }
    }

    // Determine error type and respond appropriately
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large - maximum 10MB per file',
        code: 'FILE_SIZE_LIMIT_EXCEEDED'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files - maximum 5 files per post',
        code: 'FILE_COUNT_LIMIT_EXCEEDED'
      });
    }

    res.status(500).json({
      error: 'Failed to create post',
      code: 'POST_CREATION_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function to determine media type from mimetype
 * @param {string} mimetype - MIME type of the file
 * @returns {string} Media type (image, video, document)
 */
const getMediaType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.includes('pdf') || mimetype.startsWith('application/')) return 'document';
  return 'file';
};

/**
 * @swagger
 * /api/posts/{postId}:
 *   get:
 *     summary: Get a single post by ID
 *     description: Retrieve a specific post with all engagement details and comments
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Successfully retrieved post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to retrieve post
 */
export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture username')
      .populate('likes', 'full_name profile_picture');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
};

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update a post
 *     description: Modify existing post content (owner only). Marks post as edited.
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated post content (1-5000 characters)
 *                 example: "Updated post content"
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       403:
 *         description: Unauthorized - cannot edit other user's posts
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to update post
 */
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify ownership
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Cannot edit other user posts' });
    }

    // Validate new content
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    post.content = content.trim();
    post.isEdited = true;
    post.editedAt = new Date();
    await post.save();

    await post.populate('userId', 'full_name profile_picture username');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     description: Permanently remove a post from the database (owner only)
 *     tags:
 *       - Posts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post deleted successfully"
 *       403:
 *         description: Unauthorized - cannot delete other user's posts
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to delete post
 */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify ownership
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Cannot delete other user posts' });
    }

    await Post.deleteOne({ _id: postId });

    // Emit Socket.io event for real-time feed update
    try {
      const io = getIO();
      io.to('feed').emit('post:deleted', {
        postId: post._id,
        deletedBy: userId,
        action: 'post_deleted',
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Real-time broadcast: Post deleted (${postId})`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     description: Add the current user to a post's likes. Prevents duplicate likes. Triggers real-time broadcast to all connected clients.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Post liked successfully. Real-time event emitted to all clients in 'feed' room.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post liked"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Post already liked by this user
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to like post
 * 
 * @swagger
 * components:
 *   schemas:
 *     EngagementUpdate:
 *       type: object
 *       description: Real-time Socket.io event payload for post engagement updates
 *       properties:
 *         postId:
 *           type: string
 *         action:
 *           type: string
 *           enum: ['like', 'unlike', 'comment', 'delete_comment', 'comment_reply', 'comment_react', 'share', 'unshare', 'bookmark', 'unbookmark']
 *         likesCount:
 *           type: number
 *         commentsCount:
 *           type: number
 *         sharesCount:
 *           type: number
 *         bookmarksCount:
 *           type: number
 *         latestComment:
 *           type: object
 *         updatedPost:
 *           $ref: '#/components/schemas/Post'
 */
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already liked
    if (post.likes.includes(userId)) {
      return res.status(400).json({
        error: 'Post already liked',
        code: 'ALREADY_LIKED'
      });
    }

    post.likes.push(userId);
    post.likeCount = post.likes.length;
    await post.save();

    // Populate for response
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        likesCount: post.likeCount,
        action: 'like',
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for like on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    // Send notification to post owner
    if (post.userId.toString() !== userId) {
      await sendNotification(
        post.userId,
        `Someone liked your post`,
        `post-like-${postId}`,
        `/post/${postId}`
      ).catch(err => console.warn('Notification warning:', err.message));
    }

    res.json({
      success: true,
      message: 'Post liked',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Like post error:', error);
    res.status(500).json({
      error: 'Failed to like post',
      code: 'LIKE_FAILED'
    });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/unlike:
 *   post:
 *     summary: Unlike a post
 *     description: Remove the current user from a post's likes array. Triggers real-time broadcast.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Post unliked successfully. Real-time event emitted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post unliked"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to unlike post
 */
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // Only allow unlike if user previously liked
    if (!post.likes.some(id => id.toString() === userId)) {
      return res.status(400).json({ error: 'Post not liked by user', code: 'NOT_LIKED' });
    }

    post.likes = post.likes.filter(id => id.toString() !== userId);
    post.likeCount = post.likes.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        likesCount: post.likeCount,
        action: 'unlike',
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for unlike on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({
      success: true,
      message: 'Post unliked',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Unlike post error:', error);
    res.status(500).json({
      error: 'Failed to unlike post',
      code: 'UNLIKE_FAILED'
    });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     description: Create and add a comment to a post's comments array. Triggers real-time broadcast and notifications.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Comment text content (1-2000 characters)
 *                 example: "Great post! Really informative."
 *             required:
 *               - text
 *     responses:
 *       201:
 *         description: Comment added successfully. Real-time event emitted with latest comment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment added"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid comment - empty or too long
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to add comment
 */
export const commentPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Comment cannot be empty',
        code: 'EMPTY_COMMENT'
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        error: 'Comment exceeds maximum length of 2000 characters',
        code: 'COMMENT_TOO_LONG'
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = {
      userId,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    post.commentCount = post.comments.length;
    await post.save();

    // Populate for response
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        commentsCount: post.commentCount,
        action: 'comment',
        latestComment: updatedPost.comments[updatedPost.comments.length - 1],
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for comment on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    // Send notification
    if (post.userId.toString() !== userId) {
      await sendNotification(
        post.userId,
        `Someone commented on your post`,
        `post-comment-${postId}`,
        `/post/${postId}`
      ).catch(err => console.warn('Notification warning:', err.message));
    }

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Comment post error:', error);
    res.status(500).json({
      error: 'Failed to add comment',
      code: 'COMMENT_FAILED'
    });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/comment/{commentId}:
 *   delete:
 *     summary: Delete a comment from a post
 *     description: Remove a comment from a post (comment author or post owner only). Triggers real-time broadcast.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully. Real-time event emitted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment deleted"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       403:
 *         description: Unauthorized - cannot delete other user's comments
 *       404:
 *         description: Post or comment not found
 *       500:
 *         description: Failed to delete comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify ownership
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Cannot delete other user comments' });
    }

    post.comments.id(commentId).deleteOne();
    post.commentCount = post.comments.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        commentsCount: post.commentCount,
        action: 'delete_comment',
        deletedCommentId: commentId,
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for comment deletion on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({
      success: true,
      message: 'Comment deleted',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({
      error: 'Failed to delete comment',
      code: 'DELETE_COMMENT_FAILED'
    });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/share:
 *   post:
 *     summary: Share a post
 *     description: Record a user sharing a post. Prevents duplicate shares by the same user. Triggers real-time broadcast.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Post shared successfully. Real-time event emitted with updated share count.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post shared"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Post already shared by this user
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to share post
 */
export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already shared by this user
    const alreadyShared = post.shares.some(share => 
      share.userId?.toString() === userId
    );

    if (alreadyShared) {
      return res.status(400).json({
        error: 'Already shared this post',
        code: 'ALREADY_SHARED'
      });
    }

    post.shares.push({ userId, sharedAt: new Date() });
    post.shareCount = post.shares.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        sharesCount: post.shareCount,
        action: 'share',
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for share on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({
      success: true,
      message: 'Post shared',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Share post error:', error);
    res.status(500).json({
      error: 'Failed to share post',
      code: 'SHARE_FAILED'
    });
  }
};

/**
 * Unshare a post (remove a user's share)
 */
export const unsharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only allow unshare if the user previously shared
    if (!post.shares.some(share => share.userId?.toString() === userId)) {
      return res.status(400).json({ error: 'Post not shared by user', code: 'NOT_SHARED' });
    }

    post.shares = post.shares.filter(share => share.userId?.toString() !== userId);
    post.shareCount = post.shares.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username');

    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        sharesCount: post.shareCount,
        action: 'unshare',
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for unshare on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({ success: true, message: 'Post unshared', data: updatedPost });
  } catch (error) {
    console.error('❌ Unshare post error:', error);
    res.status(500).json({ error: 'Failed to unshare post', code: 'UNSHARE_FAILED' });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   post:
 *     summary: Bookmark a post
 *     description: Save a post to the current user's bookmarks. Prevents duplicate bookmarks. Triggers real-time broadcast.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Post bookmarked successfully. Real-time event emitted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post bookmarked"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Post already bookmarked by this user
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to bookmark post
 */
export const bookmarkPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already bookmarked
    if (post.bookmarks.includes(userId)) {
      return res.status(400).json({
        error: 'Post already bookmarked',
        code: 'ALREADY_BOOKMARKED'
      });
    }

    post.bookmarks.push(userId);
    post.bookmarkCount = post.bookmarks.length;
    await post.save();

    // Also store bookmark on user profile for quick access
    try {
      await User.findByIdAndUpdate(userId, { $addToSet: { bookmarks: post._id } });
    } catch (userErr) {
      console.warn('Could not update user bookmarks:', userErr.message);
    }

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        bookmarksCount: post.bookmarkCount,
        action: 'bookmark',
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for bookmark on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({
      success: true,
      message: 'Post bookmarked',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Bookmark post error:', error);
    res.status(500).json({
      error: 'Failed to bookmark post',
      code: 'BOOKMARK_FAILED'
    });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/bookmark:
 *   delete:
 *     summary: Remove bookmark from a post
 *     description: Remove the current user from a post's bookmarks array. Triggers real-time broadcast.
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Bookmark removed successfully. Real-time event emitted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bookmark removed"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to remove bookmark
 */
export const removeBookmark = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // Only allow removal if bookmarked
    if (!post.bookmarks.some(id => id.toString() === userId)) {
      return res.status(400).json({ error: 'Post not bookmarked by user', code: 'NOT_BOOKMARKED' });
    }

    post.bookmarks = post.bookmarks.filter(id => id.toString() !== userId);
    post.bookmarkCount = post.bookmarks.length;
    await post.save();

    // Remove from user's bookmarks list as well
    try {
      await User.findByIdAndUpdate(userId, { $pull: { bookmarks: post._id } });
    } catch (userErr) {
      console.warn('Could not remove from user bookmarks:', userErr.message);
    }

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username');

    // 🔴 EMIT SOCKET EVENT - Real-time update to all connected clients
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        bookmarksCount: post.bookmarkCount,
        action: 'unbookmark',
        updatedPost: updatedPost
      });
      console.log(`📡 Emitted post:engagement_update for bookmark removal on post ${postId}`);
    } catch (socketError) {
      console.warn('⚠️ Socket.io emission failed (non-critical):', socketError.message);
    }

    res.json({
      success: true,
      message: 'Bookmark removed',
      data: updatedPost
    });
  } catch (error) {
    console.error('❌ Remove bookmark error:', error);
    res.status(500).json({
      error: 'Failed to remove bookmark',
      code: 'REMOVE_BOOKMARK_FAILED'
    });
  }
};

/**
 * Reply to a specific comment on a post
 */
export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply cannot be empty', code: 'EMPTY_REPLY' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Ensure arrays exist for older documents that may lack these fields
    comment.replies = comment.replies || [];
    comment.reactions = comment.reactions || [];
    comment.replies.push({ userId, text: text.trim(), createdAt: new Date() });
    post.commentCount = post.comments.length;
    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture username')
      .populate('comments.replies.userId', 'full_name profile_picture username');

    // Emit update
    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        action: 'comment_reply',
        latestReply: comment.replies[comment.replies.length - 1],
        updatedPost
      });
    } catch (socketError) {
      console.warn('⚠️ Socket emission failed for reply:', socketError.message);
    }

    res.status(201).json({ success: true, message: 'Reply added', data: updatedPost });
  } catch (error) {
    console.error('❌ Reply to comment error:', error);
    res.status(500).json({ error: 'Failed to add reply', code: 'REPLY_FAILED' });
  }
};

/**
 * React to a comment with an emoji (toggle)
 */
export const reactToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { emoji } = req.body;
    const userId = req.userId;

    if (!emoji) return res.status(400).json({ error: 'Emoji is required', code: 'MISSING_EMOJI' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Ensure arrays exist for older documents that may lack these fields
    comment.replies = comment.replies || [];
    comment.reactions = comment.reactions || [];

    // Toggle reaction: if same user & emoji exists, remove it, otherwise add
    const existingIndex = comment.reactions.findIndex(r => r.userId?.toString() === userId && r.emoji === emoji);
    if (existingIndex > -1) {
      comment.reactions.splice(existingIndex, 1);
    } else {
      comment.reactions.push({ userId, emoji });
    }

    await post.save();

    const updatedPost = await Post.findById(postId)
      .populate('userId', 'full_name profile_picture username')
      .populate('comments.userId', 'full_name profile_picture username')
      .populate('comments.replies.userId', 'full_name profile_picture username');

    try {
      const io = getIO();
      io.to('feed').emit('post:engagement_update', {
        postId: post._id,
        action: 'comment_react',
        commentId,
        updatedPost
      });
    } catch (socketError) {
      console.warn('⚠️ Socket emission failed for comment react:', socketError.message);
    }

    res.json({ success: true, message: 'Reaction toggled', data: updatedPost });
  } catch (error) {
    console.error('❌ React to comment error:', error);
    res.status(500).json({ error: 'Failed to react to comment', code: 'REACT_FAILED' });
  }
};

/**
 * @swagger
 * /api/posts/{postId}/status:
 *   get:
 *     summary: Get post engagement status for current user
 *     description: Check if the current user has liked, bookmarked, or shared a specific post
 *     tags:
 *       - Engagements
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Post ID
 *     responses:
 *       200:
 *         description: Successfully retrieved post engagement status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                 isLiked:
 *                   type: boolean
 *                   description: Whether current user has liked this post
 *                 isBookmarked:
 *                   type: boolean
 *                   description: Whether current user has bookmarked this post
 *                 isShared:
 *                   type: boolean
 *                   description: Whether current user has shared this post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Failed to get post status
 */
export const getPostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      postId,
      isLiked: post.likes.includes(userId),
      isBookmarked: post.bookmarks.includes(userId),
      isShared: post.shares.some(share => share.userId?.toString() === userId)
    });
  } catch (error) {
    console.error('❌ Get post status error:', error);
    res.status(500).json({
      error: 'Failed to get post status',
      code: 'STATUS_CHECK_FAILED'
    });
  }
};
