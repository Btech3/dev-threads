import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ImageKit is a real-time image optimization and delivery CDN
 * 
 * What: Service for uploading, storing, and optimizing images
 * When: Called when user uploads profile picture, post media, etc.
 * Why: Images load faster, save storage, automatic optimization
 * How: Initialize with API keys, use to upload files
 */
export const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Upload image to ImageKit
 * Deletes local file after upload
 */
export const uploadToImageKit = async (filePath, fileName) => {
  try {
    const response = await imageKit.upload({
      file: fs.readFileSync(filePath),
      fileName: fileName,
      folder: '/dev-thread'
    });

    // Delete local file
    fs.unlinkSync(filePath);

    return response.url;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    throw error;
  }
};

/**
 * Delete image from ImageKit
 */
export const deleteFromImageKit = async (fileId) => {
  try {
    await imageKit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error('ImageKit delete error:', error);
    return false;
  }
};

/**
 * Get optimized image URL
 * Can apply transformations like resize, quality, etc.
 */
export const getOptimizedImageUrl = (imageUrl, transformations = {}) => {
  const {
    width = 300,
    height = 300,
    quality = 80
  } = transformations;

  return `${imageUrl}?tr=w-${width},h-${height},q-${quality}`;
};

export default imageKit;