# ⚡ QUICK START - Test Your API in 5 Minutes

## 🎯 5-Minute API Test Guide

### Step 1: Verify Backend is Running (30 seconds)
```bash
# You should already see in terminal:
# 🚀 Server running on http://localhost:5234
# 🎯 Socket.io initialized successfully
# ✅ MongoDB Connected
```

### Step 2: Open Swagger UI (30 seconds)
```
http://localhost:5234/api-docs
```
✅ You should see the complete API documentation

### Step 3: Test Health Check (30 seconds)
1. Scroll to bottom → Find **Health Check** section
2. Click `GET /api/health`
3. Click **"Try it out"** button
4. Click **"Execute"** button
5. ✅ Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-07-25T10:35:00.000Z"
   }
   ```

### Step 4: Register Test Account (1 minute)
1. Find **Authentication** section → `POST /api/auth/register`
2. Click **"Try it out"**
3. Copy and paste this:
   ```json
   {
     "email": "testuser@example.com",
     "password": "TestPass123!",
     "full_name": "Test User",
     "username": "testuser123"
   }
   ```
4. Click **"Execute"**
5. ✅ You should get Status **201** with:
   - `"success": true`
   - `"token": "eyJhbGc..."` (long JWT string)

### Step 5: Get JWT Token (30 seconds)
From the registration response above:
1. **Find the token field** - looks like: `"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
2. **Copy the entire token string** (without quotes)
3. Save it somewhere temporarily

### Step 6: Authorize Swagger UI (30 seconds)
1. Click green **"Authorize"** button (top right of page)
2. Click **"BearerAuth"** section (may show dropdown)
3. In the **"value"** field, paste your token
4. Click **"Authorize"** button
5. Click **"Close"**
6. ✅ Now all endpoints will send your token automatically!

### Step 7: Test Creating a Post (1 minute)
1. Find **Posts** section → `POST /api/posts`
2. Click **"Try it out"**
3. Paste this:
   ```json
   {
     "content": "Hello World! 🎉 My first post on this awesome social media app!"
   }
   ```
4. Click **"Execute"**
5. ✅ You should get Status **201** with:
   - `"success": true`
   - Post object with your content
   - `likeCount: 0`, `commentCount: 0`

### Step 8: Test Getting Your Feed (30 seconds)
1. Find **Posts** section → `GET /api/posts/feed`
2. Click **"Try it out"**
3. Leave `page=1` and `limit=10`
4. Click **"Execute"**
5. ✅ You should see your post in the feed!

### Step 9: Test Liking the Post (30 seconds)
1. From the feed response, **copy the post `_id`**
2. Find **Engagements** section → `POST /api/posts/{postId}/like`
3. Click **"Try it out"**
4. Paste your post ID in the **"postId"** field
5. Click **"Execute"**
6. ✅ You should get Status **200** with:
   - `"success": true`
   - `likeCount: 1`

### Step 10: Test Real-Time (Optional - 1 minute)
1. Open **frontend** in new tab: `http://localhost:5173`
2. You should see your post in the feed
3. **Open DevTools** (F12) → **Network** tab
4. Filter by "WS" (WebSocket)
5. Click on "socket.io" connection
6. Go to **Messages** tab
7. In Swagger, **like the post again**
8. ✅ Watch WebSocket event appear in DevTools!

---

## ✅ Success! You Just Tested:

- [ ] Health check endpoint
- [ ] User registration with JWT token
- [ ] Swagger UI authorization
- [ ] Creating a post
- [ ] Getting feed posts
- [ ] Liking a post
- [ ] Real-time Socket.io events (optional)

**Total time: ~5 minutes**

---

## 🔗 Useful Links

| Resource | Link |
|----------|------|
| **API Documentation** | http://localhost:5234/api-docs |
| **Health Check** | http://localhost:5234/api/health |
| **Frontend App** | http://localhost:5173 |
| **Swagger JSON** | http://localhost:5234/api-docs.json |

---

## 📋 All 24 Endpoints Available

After health check, these are ready to test:

**Authentication (2)**
- Register, Login

**Users (3)**
- Get Profile, Update Profile, Search Users

**Posts (5)**
- Create Post, Get Feed, Get Post, Update Post, Delete Post

**Engagements (8)**
- Like, Unlike, Comment, Delete Comment, Share, Bookmark, Remove Bookmark, Get Status

**Connections (4)**
- Follow, Unfollow, Get Followers, Get Following

**Messages (4)**
- Send Message, Get Conversations, Get Messages with User, Mark Read

**Stories (3)**
- Get Stories, Create Story, Get User Stories

**Health (1)**
- Health Check

---

## 🆘 Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| **Backend not running** | `cd dev-thread-backend && npm start` |
| **Swagger shows 404** | Hard refresh: `Ctrl+Shift+R` |
| **Port 5234 in use** | `Get-Process node \| Stop-Process -Force` |
| **Token not working** | Paste without quotes, no "Bearer" prefix |
| **Real-time not working** | Reload frontend: `npm run dev` |

---

## 📚 Full Testing Guides

For **complete step-by-step instructions** for all endpoints, see:
- **SWAGGER_COMPLETE_TESTING_GUIDE_24_ENDPOINTS.md** - Detailed guide for each of 24 endpoints
- **FINAL_API_TESTING_SUMMARY.md** - Overview and checklist
- **IMPLEMENTATION_COMPLETE.md** - Full status report

---

## ✨ That's It!

You now have a fully functional social media API with:
- ✅ 24 working endpoints
- ✅ Real-time Socket.io
- ✅ JWT authentication
- ✅ Complete documentation
- ✅ Interactive testing via Swagger

**Start testing:** http://localhost:5234/api-docs

**Enjoy! 🚀**
