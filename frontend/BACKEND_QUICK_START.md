# Backend Implementation Quick Start

Complete step-by-step instructions to implement all missing backend components.

---

## 📋 Implementation Checklist

Use this checklist to track your progress as you implement each component.

### Controllers (7 files)
- [ ] `controllers/authController.js` - User authentication handling
- [ ] `controllers/userController.js` - User profile management
- [ ] `controllers/postController.js` - Post creation and interaction
- [ ] `controllers/messageController.js` - Direct messaging
- [ ] `controllers/storyController.js` - Stories feature
- [ ] `controllers/connectionController.js` - Followers/connections
- [ ] Update existing route handlers to use new controllers

### Routes (2 files)
- [ ] Complete `routes/auth.js` with all auth endpoints
- [ ] Create `routes/stories.js` for stories feature

### Middleware & Utils (4 files)
- [ ] Create `middleware/validateRequest.js` - Input validation
- [ ] Create `utils/notifications.js` - Notification handling
- [ ] Create `utils/logger.js` - Logging system
- [ ] Create `utils/imageUpload.js` - Image upload configuration

### Config Files (2 files)
- [ ] Complete `config/imagekit.js` - Image optimization service
- [ ] Verify `config/db.js` is correct

### Integration Services
- [ ] Set up INNGEST webhook integration
- [ ] Configure ImageKit for image uploads
- [ ] Implement Socket.IO notification system

### Environment Setup
- [ ] Update `.env` with all required keys
- [ ] Install all required packages
- [ ] Test each endpoint with provided CURL examples

---

## 🚀 Step-by-Step Implementation

### Step 1: Create Directory Structure

```bash
cd dev-thread-backend

# Create missing directories
mkdir -p controllers routes middleware utils config jobs services
mkdir -p logs uploads
```

### Step 2: Install All Dependencies

```bash
npm install express cors dotenv mongoose mongodb axios nodemon jsonwebtoken bcryptjs multer socket.io socket.io-client inngest @inngest/express imagekit svix
npm install --save-dev eslint prettier
```

### Step 3: Create Controllers

Copy each controller from the COMPLETE_BACKEND_IMPLEMENTATION.md file:

1. **authController.js** - Clerk webhook, logout, auth check
2. **userController.js** - Profile, search, followers
3. **postController.js** - CRUD posts, likes, comments
4. **messageController.js** - Messaging, conversations
5. **storyController.js** - Stories CRUD
6. **connectionController.js** - Follow/unfollow users

### Step 4: Create/Update Routes

Complete these route files:

1. **routes/auth.js** - Authentication endpoints
2. **routes/stories.js** - Stories endpoints
3. **routes/upload.js** - Image upload endpoint (from ImageKit section)
4. **routes/inngest.js** - Background job webhooks

### Step 5: Create Middleware

Create `middleware/validateRequest.js` with validation functions

### Step 6: Create Utils

Create the utility files:
- `utils/notifications.js` - Notification service
- `utils/logger.js` - Logging utility
- `utils/imageUpload.js` - Multer configuration

### Step 7: Create Service Files

Create service files:
- `services/notificationService.js` - Real-time Socket.IO notifications
- `jobs/postJobs.js` - INNGEST background jobs

### Step 8: Update Config Files

Create/update:
- `config/imagekit.js` - ImageKit initialization
- `config/inngest.js` - INNGEST client setup

### Step 9: Update .env

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/dev-thread

CLERK_SECRET_KEY=sk_test_your_key
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_WEBHOOK_SECRET=whsec_your_secret

JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/youraccountid

INNGEST_EVENT_KEY=your_inngest_key
INNGEST_SIGNING_KEY=your_signing_key

SEND_EMAIL_NOTIFICATIONS=false
DEBUG=false
```

### Step 10: Update server.js

See the "Update Server.js" section in COMPLETE_BACKEND_IMPLEMENTATION.md for the complete server setup with:
- All route imports
- Socket.IO configuration
- Global service initialization
- Error handling

### Step 11: Update package.json

```json
{
  "name": "dev-thread-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "axios": "^1.18.1",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "imagekit": "^4.1.3",
    "inngest": "^3.14.0",
    "@inngest/express": "^0.3.5",
    "jsonwebtoken": "^9.1.2",
    "mongodb": "3.7",
    "mongoose": "^9.7.2",
    "multer": "^1.4.5",
    "socket.io": "^4.7.2",
    "socket.io-client": "^4.7.2",
    "svix": "^1.15.0"
  },
  "devDependencies": {
    "eslint": "^10.5.0",
    "nodemon": "^3.1.14",
    "prettier": "^3.8.4"
  }
}
```

### Step 12: Test Everything

```bash
# Start server
npm run dev

# Test in another terminal
curl http://localhost:5000/api/health

# Test with provided CURL examples from COMPLETE_BACKEND_IMPLEMENTATION.md
```

---

## 📝 Quick File Reference

| File | Purpose | Status |
|------|---------|--------|
| controllers/authController.js | Clerk webhook & auth | ✅ Complete in guide |
| controllers/userController.js | User profiles | ✅ Complete in guide |
| controllers/postController.js | Post management | ✅ Complete in guide |
| controllers/messageController.js | Messaging | ✅ Complete in guide |
| controllers/storyController.js | Stories feature | ✅ Complete in guide |
| controllers/connectionController.js | Followers | ✅ Complete in guide |
| routes/auth.js | Auth endpoints | ✅ Complete in guide |
| routes/stories.js | Stories endpoints | ✅ Complete in guide |
| routes/upload.js | Image uploads | ✅ Complete in guide |
| routes/inngest.js | Background jobs | ✅ Complete in guide |
| middleware/validateRequest.js | Input validation | ✅ Complete in guide |
| middleware/auth.js | Already exists | ✅ Keep as is |
| middleware/errorHandler.js | Already exists | ✅ Keep as is |
| utils/notifications.js | Notifications | ✅ Complete in guide |
| utils/logger.js | Logging | ✅ Complete in guide |
| utils/imageUpload.js | Image handling | ✅ Complete in guide |
| config/db.js | Already exists | ✅ Keep as is |
| config/imagekit.js | ImageKit setup | ✅ Complete in guide |
| config/inngest.js | INNGEST setup | ✅ Complete in guide |
| services/notificationService.js | Real-time notifications | ✅ Complete in guide |
| jobs/postJobs.js | Background jobs | ✅ Complete in guide |

---

## 🔌 External Services Setup

### 1. Clerk Authentication
- Go to https://clerk.com
- Create application
- Get API keys
- Set up webhook at `/api/auth/webhook`

### 2. ImageKit
- Go to https://imagekit.io
- Create free account
- Get API keys
- Create folder structure in ImageKit dashboard

### 3. INNGEST
- Go to https://www.inngest.com
- Create account
- Get API key
- Setup dashboard to monitor jobs

### 4. MongoDB
- Go to https://www.mongodb.com/cloud/atlas
- Create cluster
- Create database user
- Add IP to whitelist
- Get connection string

---

## 🧪 Testing Each Feature

### Test Authentication
```bash
# Check auth status
curl http://localhost:5000/api/auth/check
```

### Test Posts
```bash
# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"content":"Hello World"}'

# Get feed
curl http://localhost:5000/api/posts/feed

# Like post
curl -X POST http://localhost:5000/api/posts/postId/like \
  -H "Authorization: Bearer token"
```

### Test Users
```bash
# Get user profile
curl http://localhost:5000/api/users/profile/userId

# Search users
curl "http://localhost:5000/api/users/search?q=john"

# Get user stats
curl http://localhost:5000/api/users/stats/userId
```

### Test Messaging
```bash
# Get conversations
curl http://localhost:5000/api/messages \
  -H "Authorization: Bearer token"

# Get messages with user
curl http://localhost:5000/api/messages/userId \
  -H "Authorization: Bearer token"

# Send message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"recipientId":"xxx","content":"Hi there"}'
```

### Test Stories
```bash
# Get active stories
curl http://localhost:5000/api/stories

# Create story
curl -X POST http://localhost:5000/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"content":"My story","media_type":"text","background_color":"#FF0000"}'

# Delete story
curl -X DELETE http://localhost:5000/api/stories/storyId \
  -H "Authorization: Bearer token"
```

### Test Connections
```bash
# Get connections
curl http://localhost:5000/api/connections \
  -H "Authorization: Bearer token"

# Follow user
curl -X POST http://localhost:5000/api/connections/userId/follow \
  -H "Authorization: Bearer token"

# Unfollow user
curl -X POST http://localhost:5000/api/connections/userId/unfollow \
  -H "Authorization: Bearer token"

# Get followers
curl http://localhost:5000/api/connections/followers \
  -H "Authorization: Bearer token"
```

### Test Image Upload
```bash
# Upload profile picture
curl -X POST http://localhost:5000/api/upload/profile-picture \
  -H "Authorization: Bearer token" \
  -F "file=@/path/to/image.jpg"

# Upload post media
curl -X POST http://localhost:5000/api/upload/post-media \
  -H "Authorization: Bearer token" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"
```

---

## ⚠️ Common Issues & Solutions

### Issue: Module not found errors
**Solution:** Run `npm install` to ensure all dependencies are installed

### Issue: Mongoose connection errors
**Solution:** 
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas
- Check database credentials

### Issue: Clerk webhook not working
**Solution:**
- Verify CLERK_WEBHOOK_SECRET in .env
- Check webhook URL in Clerk dashboard points to `/api/auth/webhook`
- View Clerk webhook logs for errors

### Issue: ImageKit uploads failing
**Solution:**
- Verify API keys in .env
- Check ImageKit folder structure is created
- View ImageKit dashboard for upload logs

### Issue: Socket.IO not connecting
**Solution:**
- Check FRONTEND_URL in .env matches your frontend
- Verify CORS is allowing your frontend origin
- Check browser console for connection errors

### Issue: INNGEST events not triggering
**Solution:**
- Verify INNGEST_EVENT_KEY in .env
- Check INNGEST dashboard for event logs
- Ensure event names match function definitions

---

## 📚 Code Examples by Use Case

### Add a New REST Endpoint

1. Add function to controller
2. Export function from controller
3. Create route in routes file
4. Use `router.get/post/put/delete(path, middleware, controller)`

Example:
```javascript
// In controller
export const myNewEndpoint = async (req, res) => {
  try {
    // Your logic
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

// In routes file
import { myNewEndpoint } from '../controllers/myController.js';
router.get('/my-endpoint', verifyClerkToken, myNewEndpoint);
```

### Trigger a Background Job

```javascript
// In your controller
import { inngest } from '../config/inngest.js';

// Trigger event
await inngest.send({
  name: 'my.event',
  data: { userId, postId, ... }
});
```

### Send Real-Time Notification

```javascript
// In your controller
import notificationService from '../services/notificationService.js';

// Send notification
notificationService.notifyNewMessage(userId, message);
```

### Upload Image

```javascript
// In routes file with multer
router.post('/upload', upload.single('file'), async (req, res) => {
  const { uploadToImageKit } = await import('../config/imagekit.js');
  const url = await uploadToImageKit(req.file.path, 'filename');
  res.json({ url });
});
```

---

## 🎯 Next Steps After Setup

1. **Test all endpoints** using provided CURL examples
2. **Monitor logs** with your logger utility
3. **Check INNGEST dashboard** for job execution
4. **Monitor ImageKit** for image uploads
5. **Set up GitHub** for version control
6. **Deploy to production** (see BACKEND_SETUP.md)
7. **Monitor errors** and fix as they arise

---

## 📖 Additional Resources

- **Express.js**: https://expressjs.com/
- **Mongoose**: https://mongoosejs.com/
- **Socket.IO**: https://socket.io/docs/
- **INNGEST**: https://www.inngest.com/docs
- **ImageKit**: https://docs.imagekit.io/
- **Clerk**: https://clerk.com/docs
- **REST API Best Practices**: https://restfulapi.net/

---

Good luck with your implementation! Refer to COMPLETE_BACKEND_IMPLEMENTATION.md for detailed code examples and explanations.
