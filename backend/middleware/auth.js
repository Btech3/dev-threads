// middleware/auth.js
import jwt from 'jsonwebtoken';
import { verifyToken as verifyClerkJwt } from '@clerk/backend';
import User from '../models/User.js';

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token || null;
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: 'Token payload is missing user id' });
    }

    req.userId = decoded.id;
    req.clerkId = decoded.clerkId || null;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const verifyClerkToken = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(500).json({ message: 'Clerk secret key is not configured' });
    }

    const verifiedClaims = await verifyClerkJwt(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    const verifiedClerkId = verifiedClaims?.sub;
    if (!verifiedClerkId) {
      return res.status(401).json({ message: 'Authenticated token has no Clerk subject' });
    }

    const legacyClerkId = req.headers['x-clerk-id'];
    if (legacyClerkId && String(legacyClerkId) !== String(verifiedClerkId)) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ message: 'Clerk identity mismatch' });
      }

      console.warn('Clerk identity header does not match the verified token subject.');
    }

    const user = await User.findOne({ clerkId: verifiedClerkId });
    if (!user?._id) {
      return res.status(401).json({ message: 'Authenticated user not found' });
    }

    req.userId = user._id;
    req.clerkId = verifiedClerkId;
    req.user = user;
    return next();
  } catch (error) {
    console.error('Clerk authentication failed:', error?.name || 'verification error');
    return res.status(401).json({ message: 'Authentication failed' });
  }
};