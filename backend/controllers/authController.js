import User from '../models/User.js';
import { Webhook } from 'svix';

/**
 * Handle Clerk authentication webhook
 * Syncs user data from Clerk to MongoDB when user is created/updated/deleted
 * 
 * What: Receives webhook events from Clerk
 * When: Called automatically by Clerk on user changes
 * Why: Keep MongoDB in sync with Clerk authentication
 * How: Verify webhook signature and update/create/delete user in DB
 */
export const handleClerkWebhook = async (req, res) => {
  try {
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    // Verify webhook signature for security
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(JSON.stringify(req.body), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    });

    const { id, type, data } = evt;

    // Handle user creation and updates
    if (type === 'user.created' || type === 'user.updated') {
      const user = await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          clerkId: data.id,
          email: data.email_addresses[0]?.email_address,
          full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          username: data.username || data.email_addresses[0]?.email_address.split('@')[0],
          profile_picture: data.image_url,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log('✅ User synced:', user.email);
    }

    // Handle user deletion
    if (type === 'user.deleted') {
      const deletedUser = await User.findOneAndDelete({ clerkId: data.id });
      console.log('✅ User deleted:', data.id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
};

/**
 * Logout endpoint
 * 
 * What: Sign out a user session
 * When: Called when user clicks logout
 * Why: Clear authentication and end session
 * How: Return success message (Clerk handles session cleanup on frontend)
 */
export const logout = (req, res) => {
  try {
    res.json({ 
      message: 'Logout successful',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Check authentication status
 * Used to verify if user is still authenticated
 */
export const checkAuth = async (req, res) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const user = await User.findById(userId).select('-__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ authenticated: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Auth check failed' });
  }
};