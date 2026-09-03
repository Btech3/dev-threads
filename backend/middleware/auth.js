// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Get clerkId from header (sent by frontend)
    const clerkId = req.headers['x-clerk-id'];
    
    if (!clerkId) {
      return res.status(401).json({ message: 'Clerk ID header required' });
    }

    // Find user by Clerk ID in database
    let user = await User.findOne({ clerkId });
    
    // If user doesn't exist, create basic user entry
    if (!user) {
      try {
        user = new User({
          clerkId,
          email: req.headers['x-clerk-email'] || `user+${clerkId}@example.com`,
          full_name: req.headers['x-clerk-name'] || 'User',
          username: `user_${clerkId.slice(0, 8)}`
        });
        await user.save();
        console.log(`✅ Auto-created user for clerkId: ${clerkId}`);
      } catch (createError) {
        console.error('Error creating user:', createError);
        // Continue anyway - use clerkId for now
      }
    }

    // Set userId from user document if available
    if (user?._id) {
      req.userId = user._id;
    } else {
      // Fallback: use clerkId as userId (will be caught by validation)
      req.userId = clerkId;
    }
    
    req.clerkId = clerkId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};