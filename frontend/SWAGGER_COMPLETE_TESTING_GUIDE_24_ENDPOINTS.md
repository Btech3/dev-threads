# 🎯 COMPLETE SWAGGER API TESTING GUIDE - Step by Step

## 📌 Overview

This guide provides complete step-by-step instructions to test all 24 API endpoints via Swagger UI with expected outputs to confirm each endpoint is working.

**Starting Flow:**
1. ✅ Health Check
2. 🔐 Authentication (Register → Login)
3. 👤 User Management (Profile, Search)
4. 📝 Post Operations (Create → Read → Update → Delete)
5. 💬 Engagements (Like → Comment → Share → Bookmark)
6. 🤝 Connections (Follow → Unfollow)
7. 💌 Messages (Send → Receive)
8. 📖 Stories (Create → Read)

---

## ⚙️ Setup Steps

### Step 1: Start Backend Server
```bash
cd "c:\Users\Ken\Desktop\Social media app\Social media app\dev-thread-backend"
npm start
```
**Expected output:**
```
🎯 Socket.io initialized successfully
🚀 Server running on http://localhost:5234
✅ MongoDB Connected: ac-oruf9uu...
```

### Step 2: Start Frontend Server (New Terminal)
```bash
cd "c:\Users\Ken\Desktop\Social media app\Social media app"
npm run dev
```
**Expected output:**
```
VITE ready in xxx ms
➜ Local: http://localhost:5176
```

### Step 3: Open Swagger UI
```
http://localhost:5234/api-docs
```

### Step 4: Authenticate in Swagger
1. Click green **"Authorize"** button (top right)
2. In dialog, click **"Available authorizations"** → **"BearerAuth"**
3. For now, click "Log Out" (we'll get token from login endpoint)

---

## 🧪 Complete Testing Flow

### 1️⃣ Health Check Endpoint
**Purpose:** Verify API server is running

**Endpoint:** `GET /api/health`

**Steps:**
1. Find "GET /api/health" (Health section at bottom)
2. Click "Try it out"
3. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "status": "ok",
  "timestamp": "2025-07-25T10:35:00.000Z"
}
```

**Success Indicator:** Status 200, response shows "ok"

---

### 2️⃣ User Registration
**Purpose:** Create new account

**Endpoint:** `POST /api/auth/register`

**Suggested Test Data:**
```json
{
  "email": "testuser123@example.com",
  "password": "SecurePass123!",
  "full_name": "Test User",
  "username": "testuser123"
}
```

**Steps:**
1. Find "POST /api/auth/register" (Authentication section)
2. Click "Try it out"
3. Clear the example JSON
4. Paste the test data above
5. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_abc123",
    "email": "testuser123@example.com",
    "full_name": "Test User",
    "username": "testuser123",
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

**Success Indicator:** Status 201, user object returned with token

**⚠️ Note:** If email already exists, try different email like "testuser456@example.com"

---

### 3️⃣ User Login
**Purpose:** Authenticate and get token

**Endpoint:** `POST /api/auth/login`

**Test Data:**
```json
{
  "email": "testuser123@example.com",
  "password": "SecurePass123!"
}
```

**Steps:**
1. Find "POST /api/auth/login" (Authentication section)
2. Click "Try it out"
3. Paste test data with your registered email and password
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "user_abc123",
    "email": "testuser123@example.com",
    "full_name": "Test User"
  }
}
```

**Success Indicator:** Status 200, token returned

**📋 Important:** Copy the token value (without quotes) for next steps

---

### 4️⃣ Authorize with Token
**Purpose:** Add token to all subsequent requests

**Steps:**
1. Click green **"Authorize"** button at top of page
2. Click **"BearerAuth"** checkbox
3. In "value" field, paste: `your_token_here` (just the token, no "Bearer" prefix)
4. Click "Authorize"
5. Click "Close"

**Result:** All endpoints now send token automatically ✅

---

### 5️⃣ Get Current User Profile
**Purpose:** Verify authentication is working

**Endpoint:** `GET /api/users/profile`

**Steps:**
1. Find "GET /api/users/profile" (Users section)
2. Click "Try it out"
3. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "user": {
    "_id": "user_abc123",
    "email": "testuser123@example.com",
    "full_name": "Test User",
    "username": "testuser123",
    "bio": null,
    "location": null,
    "followers": [],
    "following": [],
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

**Success Indicator:** Status 200, your user data returned

---

### 6️⃣ Update User Profile
**Purpose:** Update bio and location

**Endpoint:** `PUT /api/users/profile`

**Test Data:**
```json
{
  "bio": "Full Stack Developer | Web Enthusiast",
  "location": "San Francisco, CA"
}
```

**Steps:**
1. Find "PUT /api/users/profile" (Users section)
2. Click "Try it out"
3. Clear example JSON
4. Paste test data above
5. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "user_abc123",
    "bio": "Full Stack Developer | Web Enthusiast",
    "location": "San Francisco, CA"
  }
}
```

**Success Indicator:** Status 200, bio and location updated in response

---

### 7️⃣ Search Users
**Purpose:** Find other users

**Endpoint:** `GET /api/users/search`

**Steps:**
1. Find "GET /api/users/search" (Users section)
2. Click "Try it out"
3. For "q" parameter, enter: `test`
4. Leave limit as 10
5. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "results": [
    {
      "_id": "user_xyz789",
      "email": "othertest@example.com",
      "full_name": "Other Test User",
      "username": "othertest",
      "bio": "Some bio here"
    }
  ],
  "total": 1
}
```

**Success Indicator:** Status 200, users matching "test" returned

---

### 8️⃣ Create Post (Text Only)
**Purpose:** Create your first post

**Endpoint:** `POST /api/posts`

**Test Data:**
```json
{
  "content": "Hello World! 🎉 This is my first post on the social media platform. Excited to be here!"
}
```

**Steps:**
1. Find "POST /api/posts" (Posts section)
2. Click "Try it out"
3. Clear example JSON
4. Paste test data above
5. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "_id": "post_123abc",
    "userId": "user_abc123",
    "content": "Hello World! 🎉 This is my first post...",
    "media": [],
    "likeCount": 0,
    "commentCount": 0,
    "shareCount": 0,
    "bookmarkCount": 0,
    "likes": [],
    "comments": [],
    "shares": [],
    "bookmarks": [],
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

**Success Indicator:** Status 201, post ID created, counts all 0

**💡 Save the post ID** for next tests

---

### 9️⃣ Get Feed Posts
**Purpose:** See all posts

**Endpoint:** `GET /api/posts/feed`

**Steps:**
1. Find "GET /api/posts/feed" (Posts section)
2. Click "Try it out"
3. Leave page=1 and limit=10
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "posts": [
    {
      "_id": "post_123abc",
      "userId": "user_abc123",
      "content": "Hello World! 🎉...",
      "likeCount": 0,
      "commentCount": 0,
      "createdAt": "2025-07-25T10:35:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

**Success Indicator:** Status 200, your post appears in feed

---

### 🔟 Get Single Post
**Purpose:** Get details of one post

**Endpoint:** `GET /api/posts/{postId}`

**Steps:**
1. Find "GET /api/posts/{postId}" (Posts section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID from step 8️⃣
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "post": {
    "_id": "post_123abc",
    "userId": "user_abc123",
    "content": "Hello World! 🎉...",
    "likeCount": 0,
    "commentCount": 0,
    "likes": [],
    "comments": []
  }
}
```

**Success Indicator:** Status 200, full post details returned

---

### 1️⃣1️⃣ Like Post
**Purpose:** Like your own post

**Endpoint:** `POST /api/posts/{postId}/like`

**Steps:**
1. Find "POST /api/posts/{postId}/like" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post liked successfully",
  "post": {
    "_id": "post_123abc",
    "likeCount": 1,
    "likes": ["user_abc123"]
  }
}
```

**Success Indicator:** Status 200, likeCount increased from 0 to 1

**🔴 Real-Time Check:** Open frontend feed in http://localhost:5176, should see like count update instantly

---

### 1️⃣2️⃣ Add Comment
**Purpose:** Comment on post

**Endpoint:** `POST /api/posts/{postId}/comment`

**Test Data:**
```json
{
  "text": "Great post! I really enjoyed reading this. Thanks for sharing!"
}
```

**Steps:**
1. Find "POST /api/posts/{postId}/comment" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Clear example JSON and paste test data above
5. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Comment added successfully",
  "post": {
    "_id": "post_123abc",
    "commentCount": 1,
    "comments": [
      {
        "_id": "comment_xyz",
        "userId": "user_abc123",
        "text": "Great post! I really enjoyed reading this...",
        "createdAt": "2025-07-25T10:35:00.000Z"
      }
    ]
  }
}
```

**Success Indicator:** Status 201, commentCount increased to 1

---

### 1️⃣3️⃣ Share Post
**Purpose:** Share post with your followers

**Endpoint:** `POST /api/posts/{postId}/share`

**Steps:**
1. Find "POST /api/posts/{postId}/share" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Click **"Execute"** (no request body needed)

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post shared successfully",
  "post": {
    "_id": "post_123abc",
    "shareCount": 1,
    "shares": ["user_abc123"]
  }
}
```

**Success Indicator:** Status 200, shareCount increased to 1

---

### 1️⃣4️⃣ Bookmark Post
**Purpose:** Save post for later

**Endpoint:** `POST /api/posts/{postId}/bookmark`

**Steps:**
1. Find "POST /api/posts/{postId}/bookmark" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Click **"Execute"** (no request body needed)

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post bookmarked successfully",
  "post": {
    "_id": "post_123abc",
    "bookmarkCount": 1,
    "bookmarks": ["user_abc123"]
  }
}
```

**Success Indicator:** Status 200, bookmarkCount increased to 1

---

### 1️⃣5️⃣ Get Post Status
**Purpose:** Check your engagement status

**Endpoint:** `GET /api/posts/{postId}/status`

**Steps:**
1. Find "GET /api/posts/{postId}/status" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "status": {
    "isLiked": true,
    "isBookmarked": true,
    "isShared": true,
    "hasCommented": true,
    "likeCount": 1,
    "commentCount": 1,
    "shareCount": 1,
    "bookmarkCount": 1
  }
}
```

**Success Indicator:** Status 200, all engagement flags true, counts match previous operations

---

### 1️⃣6️⃣ Unlike Post
**Purpose:** Remove like from post

**Endpoint:** `POST /api/posts/{postId}/unlike`

**Steps:**
1. Find "POST /api/posts/{postId}/unlike" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Like removed successfully",
  "post": {
    "_id": "post_123abc",
    "likeCount": 0,
    "likes": []
  }
}
```

**Success Indicator:** Status 200, likeCount decreased to 0

---

### 1️⃣7️⃣ Remove Bookmark
**Purpose:** Remove bookmark from post

**Endpoint:** `DELETE /api/posts/{postId}/bookmark`

**Steps:**
1. Find "DELETE /api/posts/{postId}/bookmark" (Engagements section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Bookmark removed successfully",
  "post": {
    "_id": "post_123abc",
    "bookmarkCount": 0,
    "bookmarks": []
  }
}
```

**Success Indicator:** Status 200, bookmarkCount decreased to 0

---

### 1️⃣8️⃣ Delete Comment
**Purpose:** Remove your comment

**Endpoint:** `DELETE /api/posts/{postId}/comment/{commentId}`

**Steps:**
1. Get comment ID from previous GET post response
2. Find "DELETE /api/posts/{postId}/comment/{commentId}" (Engagements section)
3. Click "Try it out"
4. For "postId" parameter, paste your post ID
5. For "commentId" parameter, paste the comment ID
6. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "post": {
    "_id": "post_123abc",
    "commentCount": 0,
    "comments": []
  }
}
```

**Success Indicator:** Status 200, commentCount decreased to 0

---

### 1️⃣9️⃣ Update Post
**Purpose:** Edit post content

**Endpoint:** `PUT /api/posts/{postId}`

**Test Data:**
```json
{
  "content": "Updated: Hello World! 🎉 This is my UPDATED post on the social media platform. Still excited!"
}
```

**Steps:**
1. Find "PUT /api/posts/{postId}" (Posts section)
2. Click "Try it out"
3. For "postId" parameter, paste your post ID
4. Clear example JSON and paste test data above
5. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post updated successfully",
  "post": {
    "_id": "post_123abc",
    "content": "Updated: Hello World! 🎉...",
    "updatedAt": "2025-07-25T10:40:00.000Z"
  }
}
```

**Success Indicator:** Status 200, content updated

---

### 2️⃣0️⃣ Follow User (Create Another Account First)
**Purpose:** Follow another user

**Endpoint:** `POST /api/connections/follow/{userId}`

**Pre-requisite:** Create another test account with different email

**Steps:**
1. Register another account (repeat step 2️⃣ with different email)
2. Copy that user's ID
3. Use original account token (in Authorize)
4. Find "POST /api/connections/follow/{userId}" (Connections section)
5. Click "Try it out"
6. For "userId" parameter, paste the other user's ID
7. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "User followed successfully",
  "followingCount": 1
}
```

**Success Indicator:** Status 200, followingCount increased

---

### 2️⃣1️⃣ Get Following List
**Purpose:** See who you follow

**Endpoint:** `GET /api/connections/following`

**Steps:**
1. Find "GET /api/connections/following" (Connections section)
2. Click "Try it out"
3. Leave page=1, limit=10
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "following": [
    {
      "_id": "user_xyz789",
      "email": "othertest@example.com",
      "full_name": "Other Test User",
      "username": "othertest"
    }
  ],
  "total": 1,
  "page": 1
}
```

**Success Indicator:** Status 200, followed user in list

---

### 2️⃣2️⃣ Send Message
**Purpose:** Send direct message

**Endpoint:** `POST /api/messages`

**Test Data:**
```json
{
  "recipientId": "user_xyz789",
  "content": "Hey! How are you doing? Let's chat! 😊"
}
```

**Steps:**
1. Find "POST /api/messages" (Messages section)
2. Click "Try it out"
3. Clear example JSON and paste test data above (use other user's ID)
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "msg_abc123",
    "senderId": "user_abc123",
    "recipientId": "user_xyz789",
    "content": "Hey! How are you doing? Let's chat! 😊",
    "isRead": false,
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

**Success Indicator:** Status 201, message ID created

**🔴 Real-Time Check:** Should see message delivered instantly via Socket.io

---

### 2️⃣3️⃣ Get Conversations
**Purpose:** See all conversations

**Endpoint:** `GET /api/messages`

**Steps:**
1. Find "GET /api/messages" (Messages section)
2. Click "Try it out"
3. Leave page=1, limit=10
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "conv_123",
      "participantId": "user_xyz789",
      "lastMessage": "Hey! How are you doing? Let's chat! 😊",
      "unreadCount": 0,
      "lastMessageTime": "2025-07-25T10:35:00.000Z"
    }
  ],
  "total": 1
}
```

**Success Indicator:** Status 200, conversation appears

---

### 2️⃣4️⃣ Create Story
**Purpose:** Create 24-hour story

**Endpoint:** `POST /api/stories`

**Test Data:**
```json
{
  "content": "Just woke up! Ready to code today 💻☀️"
}
```

**Steps:**
1. Find "POST /api/stories" (Stories section)
2. Click "Try it out"
3. Clear example JSON and paste test data above
4. Click **"Execute"**

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Story created successfully",
  "story": {
    "_id": "story_abc123",
    "userId": "user_abc123",
    "content": "Just woke up! Ready to code today 💻☀️",
    "expiresAt": "2025-07-26T10:35:00.000Z",
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

**Success Indicator:** Status 201, story created with 24h expiry

---

## ✅ Complete Testing Checklist

After completing all 24 endpoints above, verify:

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| Health Check | GET | 200 | ✅ |
| Register | POST | 201 | ✅ |
| Login | POST | 200 | ✅ |
| Get Profile | GET | 200 | ✅ |
| Update Profile | PUT | 200 | ✅ |
| Search Users | GET | 200 | ✅ |
| Create Post | POST | 201 | ✅ |
| Get Feed | GET | 200 | ✅ |
| Get Single Post | GET | 200 | ✅ |
| Like Post | POST | 200 | ✅ |
| Add Comment | POST | 201 | ✅ |
| Share Post | POST | 200 | ✅ |
| Bookmark Post | POST | 200 | ✅ |
| Get Post Status | GET | 200 | ✅ |
| Unlike Post | POST | 200 | ✅ |
| Remove Bookmark | DELETE | 200 | ✅ |
| Delete Comment | DELETE | 200 | ✅ |
| Update Post | PUT | 200 | ✅ |
| Delete Post | DELETE | 200 | ✅ |
| Follow User | POST | 200 | ✅ |
| Get Following | GET | 200 | ✅ |
| Send Message | POST | 201 | ✅ |
| Get Conversations | GET | 200 | ✅ |
| Create Story | POST | 201 | ✅ |

---

## 🔴 Real-Time Testing (Socket.io)

### Test Real-Time Updates:

1. **Create Post:** Post from Swagger → See instantly in frontend without refresh
2. **Like Post:** Like from Swagger → Like count updates in other browser tabs instantly
3. **Comment:** Comment from Swagger → Comment appears in feed instantly
4. **Send Message:** Message from Swagger → Appears in recipient's chat instantly

**DevTools Check:**
- Open DevTools (F12)
- Network tab → Filter "WS"
- Click "socket.io" connection
- Go to "Messages" tab
- Perform actions and see Socket.io events broadcast

---

## 🎓 Key Points to Remember

1. **Authentication:** Get token from login, paste in Authorize button
2. **Try It Out:** All endpoints have "Try it out" button for testing
3. **Request/Response:** Both visible in Swagger UI
4. **Real-Time:** Socket.io broadcasts updates to all connected users
5. **Status Codes:**
   - 200 = Success
   - 201 = Created
   - 400 = Bad Request
   - 401 = Unauthorized
   - 403 = Forbidden
   - 404 = Not Found
   - 500 = Server Error

---

## 🚀 You're Ready!

All 24 endpoints are fully documented with Try It Out functionality. Follow the steps above to test each one. 

**Next Step:** Test all endpoints and verify real-time updates in frontend! ✅

