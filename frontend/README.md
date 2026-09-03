# Dev Thread - Social Media Platform

A modern, responsive social media application built with React + Vite, featuring real-time messaging, user connections, content discovery, and user authentication via Clerk.

---

## 📋 Project Overview

**Dev Thread** is a full-stack social media platform designed for developers and creators to connect, share ideas, and collaborate. The frontend is fully implemented with a robust UI, while the backend infrastructure needs to be set up.

### ✅ What Has Been Completed (Frontend)

#### **Core Application Structure**
- ✅ React 19 with Vite for fast development and production builds
- ✅ React Router v7 for seamless client-side navigation
- ✅ Responsive mobile-first design using Tailwind CSS v4
- ✅ Clerk authentication integration for secure user authentication
- ✅ Lucide React icons for consistent UI components

#### **Pages & Features Implemented**

| Page | Features | Status |
|------|----------|--------|
| **Login** | Clerk authentication, branded landing page | ✅ Complete |
| **Feed** | Post display, stories bar, interaction controls | ✅ Complete |
| **Profile** | User profile, cover photo, bio, post history | ✅ Complete |
| **Messages** | User list, message interface | ✅ Complete |
| **Chatbox** | One-on-one messaging interface | ✅ Complete |
| **Connections** | Followers, following, pending requests | ✅ Complete |
| **Discover** | Search users, suggestions, follow functionality | ✅ Complete |
| **Create Post** | Post content creation, text/media support | ✅ Complete |
| **Layout** | Main app layout with sidebar navigation | ✅ Complete |

#### **Components**
- ✅ **Sidebar** - Main navigation with responsive drawer on mobile
- ✅ **Loading** - Loading state component
- ✅ **MenuItems** - Navigation menu rendering
- ✅ **StoriesBar** - Stories carousel display

#### **Styling & UX**
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Dark mode ready with Tailwind utilities
- ✅ Smooth transitions and animations
- ✅ Mobile hamburger menu with overlay drawer
- ✅ Consistent color scheme (indigo/purple accent: `#5c33f6`)

#### **Asset Management**
- ✅ Dummy data structure for development
- ✅ Sample images and icons
- ✅ Logo and branding assets

---

## 📦 Project Stack

### Frontend Dependencies
```json
{
  "react": "^19.2.6",
  "react-dom": "^19.2.6",
  "react-router-dom": "^7.15.0",
  "tailwindcss": "^4.3.0",
  "@tailwindcss/vite": "^4.3.0",
  "@clerk/react": "^6.6.6",
  "lucide-react": "^1.14.0"
}
```

### Dev Dependencies
- Vite 8.0.12
- ESLint 10.3.0 with React plugins
- TypeScript support ready

---

## 🚀 Frontend Setup & Running

### Prerequisites
- Node.js 16+ and npm/yarn
- Clerk account (for authentication)

### Installation
```bash
# Clone the repository
cd "d:\Social media app"

# Install dependencies
npm install

# Create .env.local file and add:
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_public_key_here
```

### Running the Application

**Development Mode**
```bash
npm run dev
# Starts at http://localhost:5173
```

**Build for Production**
```bash
npm run build
# Creates optimized build in dist/

npm run preview
# Preview the production build locally
```

**Linting**
```bash
npm run lint
# Check code quality with ESLint
```

---

## 🔗 Backend Setup Guide

The frontend is fully functional but requires a backend API to persist data. Here's how to set up the backend:

### Backend Requirements

The backend should provide the following:
- Database: MongoDB (recommended) or PostgreSQL
- Runtime: Node.js/Express or equivalent
- Authentication: Clerk webhook integration
- Real-time: WebSocket for messaging (optional but recommended)

### Recommended Backend Stack

**Option 1: Node.js + Express + MongoDB**
```
Backend Structure:
backend/
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Message.js
│   └── Connection.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── messages.js
│   └── connections.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── postController.js
│   ├── messageController.js
│   └── connectionController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── config/
│   └── db.js
├── .env
├── server.js
└── package.json
```

**Option 2: Node.js + Express + PostgreSQL**
```
Similar structure with PostgreSQL queries instead of Mongoose
```

### Database Schema (MongoDB Examples)

#### **User Schema**
```javascript
{
  _id: ObjectId,
  clerkId: String,          // Clerk user ID
  email: String,
  full_name: String,
  username: String,
  bio: String,
  profile_picture: String,  // URL
  cover_photo: String,      // URL
  location: String,
  followers: [ObjectId],    // Array of user IDs
  following: [ObjectId],
  connections: [ObjectId],
  is_verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Post Schema**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // Reference to User
  content: String,
  media_urls: [String],
  likes: [ObjectId],        // User IDs who liked
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }],
  shares: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### **Message Schema**
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  recipientId: ObjectId,
  content: String,
  media_url: String,
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Story Schema**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  media_url: String,
  media_type: String,      // "text", "image", "video"
  background_color: String,
  expiresAt: Date,         // Stories expire after 24hrs
  createdAt: Date,
  updatedAt: Date
}
```

#### **Connection Schema**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  targetUserId: ObjectId,
  status: String,          // "pending", "accepted", "blocked"
  createdAt: Date,
  updatedAt: Date
}
```

### Required API Endpoints

#### **Authentication**
- `POST /api/auth/webhook` - Clerk webhook for user sync
- `POST /api/auth/logout` - Logout handler

#### **Users**
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `GET /api/users/search?q=query` - Search users

#### **Posts**
- `GET /api/posts/feed` - Get user feed
- `POST /api/posts` - Create new post
- `GET /api/posts/:postId` - Get single post
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/like` - Like post
- `POST /api/posts/:postId/comment` - Add comment

#### **Messages**
- `GET /api/messages/:userId` - Get conversation
- `POST /api/messages` - Send message
- `GET /api/messages` - List all conversations
- `DELETE /api/messages/:messageId` - Delete message

#### **Connections**
- `GET /api/connections` - Get all connections
- `GET /api/connections/followers` - Get followers
- `GET /api/connections/following` - Get following list
- `POST /api/connections/:userId/follow` - Follow user
- `POST /api/connections/:userId/unfollow` - Unfollow user
- `POST /api/connections/:userId/request` - Send connection request
- `POST /api/connections/:userId/accept` - Accept request

#### **Stories**
- `GET /api/stories` - Get all stories
- `POST /api/stories` - Create story
- `DELETE /api/stories/:storyId` - Delete story

### Environment Variables (Backend)

Create a `.env` file in the backend root:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/dev-thread
# OR for PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/dev-thread

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# Server
PORT=5000
NODE_ENV=development

# JWT (if using custom auth)
JWT_SECRET=your_jwt_secret_key

# CORS
FRONTEND_URL=http://localhost:5173
```

### Clerk Webhook Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks**
3. Create endpoint pointing to: `http://your-backend-domain/api/auth/webhook`
4. Select events: `user.created`, `user.updated`, `user.deleted`
5. Copy webhook signing secret to `.env`

### Frontend API Integration

Update the frontend to call backend endpoints:

1. Create API service file:
   ```javascript
   // src/services/api.js
   const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

   export const fetchFeed = async () => {
     const res = await fetch(`${API_BASE}/posts/feed`);
     return res.json();
   };

   export const createPost = async (content, media) => {
     const res = await fetch(`${API_BASE}/posts`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ content, media })
     });
     return res.json();
   };
   ```

2. Add to frontend `.env.local`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Replace dummy data with API calls in components:
   ```javascript
   // Before: Using dummyPostsData
   // After:
   useEffect(() => {
     fetchFeed().then(setPosts);
   }, []);
   ```

---

## 📱 Frontend Routes

```
/                    → Login page (if not authenticated) → Feed (if authenticated)
/                    → Feed (home)
/message             → Messages list
/message/:userId     → Chat with user
/connection          → Connections/followers/following
/discover            → Discover users
/create-post         → Create new post
/profile             → Current user profile
/profile/:profileId  → Other user's profile
```

---

## 🔐 Authentication Flow

1. User visits app
2. Clerk redirects unauthenticated users to login
3. After login, `useUser()` hook provides user data
4. Backend receives Clerk webhook with user info
5. Backend creates/updates user in database
6. Frontend stores auth token and calls API endpoints

---

## 📝 Dummy Data Structure

The frontend uses dummy data from `src/assets/assets.js`:
- `dummyUserData` - Current logged-in user
- `dummyStoriesData` - Sample stories (4 entries)
- `dummyPostsData` - Sample posts (from assets.js)
- `dummyConnectionsData` - Sample users for connections/discover
- `menuItemsData` - Navigation menu items

Replace these with real API calls once backend is ready.

---

## 🎨 Customization

### Colors
Primary color: `#5c33f6` (Indigo)
Update in components or create Tailwind config:
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: '#5c33f6'
      }
    }
  }
}
```

### Branding
- Logo: `src/assets/logo.svg`
- Background: `src/assets/bgImage.png`
- Update in `assets/assets.js`

---

## 🐛 Troubleshooting

**Clerk authentication not working:**
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
- Check Clerk dashboard for redirect URLs

**Styles not loading:**
- Ensure Tailwind is properly configured in `vite.config.js`
- Clear cache: `npm run build` or restart dev server

**Components not rendering:**
- Check browser console for errors
- Verify all imports from `assets/assets.js` exist

---

## 📄 License

This project is part of Dev Thread platform. All rights reserved.

---

## 🤝 Next Steps

1. **Set up backend** using the guide above
2. **Connect API endpoints** to frontend components
3. **Implement WebSocket** for real-time messaging
4. **Add file uploads** for profile pictures and media
5. **Deploy** frontend (Vercel, Netlify) and backend (Heroku, AWS)

---

## 📞 Support

For issues or questions, check the backend documentation or contact the development team.
