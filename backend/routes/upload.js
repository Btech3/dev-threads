import express from 'express';
import multer from 'multer';
import User from '../models/User.js';
import { verifyClerkToken } from '../middleware/auth.js';
import { imageKit, uploadToImageKit, getOptimizedImageUrl } from '../config/imagekit.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const resolveMessageType = (file = {}) => {
  const mimetype = String(file.mimetype || '').toLowerCase();

  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';

  return 'document';
};

const handleMediaUpload = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = files.map(file =>
      imageKit.upload({
        file: file.buffer,
        fileName: `media-${req.userId}-${Date.now()}-${Math.random()}`,
        folder: '/dev-thread/messages'
      })
    );

    const results = await Promise.all(uploadPromises);
    const mediaItems = results.map((result, index) => {
      const file = files[index];
      const messageType = resolveMessageType(file);

      return {
        url: result.url,
        messageType,
        fileName: file?.originalname || `media-${Date.now()}-${index}`,
        mimetype: file?.mimetype || '',
        size: file?.size || 0,
        type: messageType
      };
    });

    const firstItem = mediaItems[0] || {};

    res.json({
      message: 'Media uploaded successfully',
      mediaUrl: firstItem.url || null,
      messageType: firstItem.messageType || firstItem.type || 'document',
      fileName: firstItem.fileName || '',
      media: mediaItems,
      data: { media: mediaItems, mediaUrl: firstItem.url || null, messageType: firstItem.messageType || firstItem.type || 'document' }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

/**
 * Upload profile picture
 * 
 * What: Upload and optimize user profile image
 * When: When user changes profile picture
 * Why: Use CDN for fast delivery, automatic optimization
 * How: Upload to ImageKit, get optimized URL, save to user DB
 */
router.post('/profile-picture', verifyClerkToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to ImageKit
    const imageKitResponse = await imageKit.upload({
      file: req.file.buffer,
      fileName: `profile-${req.userId}-${Date.now()}`,
      folder: '/dev-thread/profile-pictures'
    });

    // Get optimized URL
    const optimizedUrl = getOptimizedImageUrl(imageKitResponse.url, {
      width: 200,
      height: 200,
      quality: 85
    });

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profile_picture: imageKitResponse.url },
      { new: true }
    );

    res.json({
      message: 'Profile picture uploaded',
      url: imageKitResponse.url,
      optimizedUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * Upload post media
 */
router.post('/post-media', verifyClerkToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = req.files.map(file =>
      imageKit.upload({
        file: file.buffer,
        fileName: `post-${req.userId}-${Date.now()}-${Math.random()}`,
        folder: '/dev-thread/posts'
      })
    );

    const results = await Promise.all(uploadPromises);

    const mediaUrls = results.map(result => ({
      url: result.url,
      optimized: getOptimizedImageUrl(result.url, { width: 600, height: 600, quality: 85 })
    }));

    res.json({
      message: 'Media uploaded',
      media: mediaUrls
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/cover-photo', verifyClerkToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No cover photo file provided' });
    }

    const imageKitResponse = await imageKit.upload({
      file: req.file.buffer,
      fileName: `cover-${req.userId}-${Date.now()}`,
      folder: '/dev-thread/cover-photos'
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { cover_photo: imageKitResponse.url, updatedAt: new Date() },
      { new: true }
    ).select('-__v');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Cover photo uploaded',
      url: imageKitResponse.url,
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/upload', verifyClerkToken, upload.array('files', 5), handleMediaUpload);
router.post('/media', verifyClerkToken, upload.array('files', 5), handleMediaUpload);
router.post('/message-media', verifyClerkToken, upload.array('files', 5), handleMediaUpload);

export default router;