# API Testing Guide - Dev Thread Backend

Complete guide to test every endpoint of the Dev Thread backend with expected responses and debugging tips.

---

## 📋 Table of Contents

1. [Setup & Tools](#setup--tools)
2. [Testing Environment](#testing-environment)
3. [Authentication](#authentication)
4. [User Endpoints](#user-endpoints)
5. [Post Endpoints](#post-endpoints)
6. [Message Endpoints](#message-endpoints)
7. [Connection Endpoints](#connection-endpoints)
8. [Story Endpoints](#story-endpoints)
9. [Common Errors & Fixes](#common-errors--fixes)
10. [Testing Checklist](#testing-checklist)

---

## 🛠️ Setup & Tools

### Prerequisites
- Node.js backend running on `http://localhost:5000`
- MongoDB connected and running
- Clerk authentication configured
- Frontend running on `http://localhost:5173` (optional for full testing)

### Tools to Use (Choose One or More)

#### 1. **Postman** (Recommended - Most Popular)
- **Download**: https://www.postman.com/downloads/
- **Features**: Full GUI, collections, environment variables, team collaboration
- **Setup Time**: 2 minutes
- **Best For**: Comprehensive API testing, learning, documentation

**Installation Steps**:
```bash
# Windows - Download installer from https://www.postman.com/downloads/
# macOS
brew install postman

# Linux
sudo snap install postman
```

#### 2. **Insomnia** (Modern Alternative)
- **Download**: https://insomnia.rest/download
- **Features**: Clean UI, similar to Postman, lightweight
- **Setup Time**: 2 minutes

#### 3. **Thunder Client** (VS Code Extension)
- **Installation**: Open VS Code → Extensions → Search "Thunder Client" → Install
- **Features**: Built-in VS Code, no external app needed
- **Setup Time**: 1 minute
- **Best For**: Quick testing while coding

**Installation Command**:
```bash
code --install-extension rangav.vscode-thunder-client
```

#### 4. **cURL** (Command Line - No Installation)
- **Best For**: Quick testing, automation, CI/CD
- **No setup needed** - Available on all systems

#### 5. **REST Client** (VS Code Extension)
- **Installation**: Open VS Code → Extensions → Search "REST Client" → Install
- **Setup Time**: 1 minute
- **Best For**: Testing with `.http` or `.rest` files

---

## 📡 Testing Environment

### Step 1: Create Environment Variables in Postman

**Steps**:
1. In Postman: Click "Environments" (left sidebar)
2. Click "+ Create New"
3. Name it: `Dev Thread Local`
4. Add variables:

| Variable | Type | Initial Value | Current Value |
|----------|------|---|---|
| `base_url` | string | http://localhost:5000 | http://localhost:5000 |
| `clerk_id` | string | user_2zdFoZib5lNr614LgkONdD8WG32 | user_2zdFoZib5lNr614LgkONdD8WG32 |
| `test_user_id` | string | user_2 | user_2 |
| `test_post_id` | string | 68773e977db16954a783839c | 68773e977db16954a783839c |
| `test_message_id` | string | (leave empty) | (leave empty) |
| `jwt_token` | string | (leave empty) | (leave empty) |

5. Click "Save"

### Step 2: Create a Collection

**Steps**:
1. Click "Collections" (left sidebar)
2. Click "+ Create New"
3. Name it: `Dev Thread API Tests`
4. You'll add requests here

---

## 🔐 Authentication

### Understanding Authentication Flow

Dev Thread uses **Clerk** for authentication. There are two main ways to authenticate:

#### Method 1: Clerk Token (Frontend approach)
```http
X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
```

#### Method 2: JWT Token (Custom Backend tokens - if implemented)
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Test Authentication

**Postman Steps**:
1. Create a new request
2. **Method**: POST
3. **URL**: `{{base_url}}/api/auth/login` (or appropriate endpoint)
4. **Headers**:
   ```
   X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
   Content-Type: application/json
   ```
5. **Body** (if needed):
   ```json
   {
     "email": "admin@example.com",
     "clerkId": "user_2zdFoZib5lNr614LgkONdD8WG32"
   }
   ```
6. Click "Send"

---

## 👤 User Endpoints

### 1. Get User Profile

**Test This Endpoint**:

```http
GET http://localhost:5000/api/users/profile/user_2zdFoZib5lNr614LgkONdD8WG32
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/users/profile/{{clerk_id}}`
- **Headers**: None needed (public endpoint)

**Expected Response** ✅:
```json
{
  "success": true,
  "data": {
    "_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "email": "admin@example.com",
    "full_name": "John Warren",
    "username": "john_warren",
    "bio": "🌍 Dreamer | 📚 Learner | 🚀 Doer",
    "profile_picture": "https://...",
    "cover_photo": "https://...",
    "location": "New York, NY",
    "followers": 245,
    "following": 128,
    "posts_count": 42,
    "is_verified": true,
    "createdAt": "2025-07-09T09:26:59.231Z"
  }
}
```

**Error Response** ❌:
```json
{
  "success": false,
  "message": "User not found",
  "status": 404
}
```

---

### 2. Update User Profile

**Test This Endpoint**:

```http
PUT http://localhost:5000/api/users/profile/user_2zdFoZib5lNr614LgkONdD8WG32
```

**Postman Setup**:
- **Method**: PUT
- **URL**: `{{base_url}}/api/users/profile/{{clerk_id}}`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "full_name": "John Warren Updated",
    "bio": "Updated bio",
    "location": "Los Angeles, CA",
    "profile_picture": "https://new-image-url.com/photo.jpg"
  }
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "full_name": "John Warren Updated",
    "bio": "Updated bio",
    "location": "Los Angeles, CA",
    "profile_picture": "https://new-image-url.com/photo.jpg",
    "updatedAt": "2025-07-25T10:30:00.000Z"
  }
}
```

---

### 3. Search Users

**Test This Endpoint**:

```http
GET http://localhost:5000/api/users/search?q=john&limit=10
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/users/search?q=john&limit=10`
- **Query Parameters**:
  ```
  q: john
  limit: 10
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
      "full_name": "John Warren",
      "username": "john_warren",
      "profile_picture": "https://...",
      "is_verified": true
    }
  ]
}
```

---

### 4. Get User Stats

**Test This Endpoint**:

```http
GET http://localhost:5000/api/users/stats/user_2zdFoZib5lNr614LgkONdD8WG32
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/users/stats/{{clerk_id}}`

**Expected Response** ✅:
```json
{
  "success": true,
  "data": {
    "followers_count": 245,
    "following_count": 128,
    "posts_count": 42,
    "stories_count": 6,
    "connections_count": 150
  }
}
```

---

## 📝 Post Endpoints

### 1. Get Feed (All Posts)

**Test This Endpoint**:

```http
GET http://localhost:5000/api/posts/feed?page=1&limit=10
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/posts/feed?page=1&limit=10`
- **Query Parameters**:
  ```
  page: 1
  limit: 10
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "68773e977db16954a783839c",
      "userId": "user_2zdFoZib5lNr614LgkONdD8WG32",
      "user": {
        "_id": "user_2zdFoZib5lNr614LgkONdD8WG32",
        "full_name": "John Warren",
        "profile_picture": "https://..."
      },
      "content": "We're a small team with a big vision...",
      "media": ["https://images.pexels.com/photos/1595385/..."],
      "likes_count": 45,
      "comments_count": 12,
      "shares_count": 5,
      "createdAt": "2025-07-16T05:54:31.191Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156
  }
}
```

---

### 2. Create Post

**Test This Endpoint**:

```http
POST http://localhost:5000/api/posts
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/posts`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "content": "This is my new post! 🚀",
    "media": []
  }
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "_id": "688a4f5c9e2d3c1b8f9a7d6e",
    "userId": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "content": "This is my new post! 🚀",
    "media": [],
    "likes": [],
    "comments": [],
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

---

### 3. Create Post with Image

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/posts`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: multipart/form-data
  ```
- **Body** (form-data):
  ```
  content: "Check out this amazing photo!"
  media: (select image file)
  ```

---

### 4. Get Single Post

**Test This Endpoint**:

```http
GET http://localhost:5000/api/posts/68773e977db16954a783839c
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/posts/{{test_post_id}}`

**Expected Response** ✅:
```json
{
  "success": true,
  "data": {
    "_id": "68773e977db16954a783839c",
    "userId": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "content": "Post content here",
    "media": [],
    "likes": 45,
    "comments": [
      {
        "_id": "688a4f5c9e2d3c1b8f9a7d6f",
        "userId": "user_2",
        "full_name": "Richard Hendricks",
        "text": "Great post!",
        "createdAt": "2025-07-25T10:35:00.000Z"
      }
    ],
    "createdAt": "2025-07-16T05:54:31.191Z"
  }
}
```

---

### 5. Like Post

**Test This Endpoint**:

```http
POST http://localhost:5000/api/posts/68773e977db16954a783839c/like
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/posts/{{test_post_id}}/like`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post liked",
  "data": {
    "likes_count": 46,
    "isLiked": true
  }
}
```

---

### 6. Unlike Post

**Test This Endpoint**:

```http
POST http://localhost:5000/api/posts/68773e977db16954a783839c/unlike
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/posts/{{test_post_id}}/unlike`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post unliked",
  "data": {
    "likes_count": 45,
    "isLiked": false
  }
}
```

---

### 7. Add Comment to Post

**Test This Endpoint**:

```http
POST http://localhost:5000/api/posts/68773e977db16954a783839c/comment
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/posts/{{test_post_id}}/comment`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "text": "Great post! Thanks for sharing!"
  }
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Comment added",
  "data": {
    "_id": "688a4f5c9e2d3c1b8f9a7d6f",
    "userId": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "full_name": "John Warren",
    "text": "Great post! Thanks for sharing!",
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

---

### 8. Update Post

**Test This Endpoint**:

```http
PUT http://localhost:5000/api/posts/68773e977db16954a783839c
```

**Postman Setup**:
- **Method**: PUT
- **URL**: `{{base_url}}/api/posts/{{test_post_id}}`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "content": "Updated post content"
  }
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post updated successfully",
  "data": {
    "_id": "68773e977db16954a783839c",
    "content": "Updated post content",
    "updatedAt": "2025-07-25T10:40:00.000Z"
  }
}
```

---

### 9. Delete Post

**Test This Endpoint**:

```http
DELETE http://localhost:5000/api/posts/68773e977db16954a783839c
```

**Postman Setup**:
- **Method**: DELETE
- **URL**: `{{base_url}}/api/posts/{{test_post_id}}`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

## 💬 Message Endpoints

### 1. Get Conversations

**Test This Endpoint**:

```http
GET http://localhost:5000/api/messages
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/messages`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "conv_1",
      "recipientId": "user_2",
      "recipient": {
        "_id": "user_2",
        "full_name": "Richard Hendricks",
        "profile_picture": "https://..."
      },
      "lastMessage": "Hey, how are you?",
      "lastMessageTime": "2025-07-25T10:35:00.000Z",
      "unreadCount": 2
    }
  ]
}
```

---

### 2. Get Messages with User

**Test This Endpoint**:

```http
GET http://localhost:5000/api/messages/user_2
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/messages/{{test_user_id}}`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "msg_1",
      "senderId": "user_2zdFoZib5lNr614LgkONdD8WG32",
      "recipientId": "user_2",
      "content": "Hi there!",
      "isRead": true,
      "createdAt": "2025-07-25T10:30:00.000Z"
    },
    {
      "_id": "msg_2",
      "senderId": "user_2",
      "recipientId": "user_2zdFoZib5lNr614LgkONdD8WG32",
      "content": "Hello! How are you?",
      "isRead": false,
      "createdAt": "2025-07-25T10:32:00.000Z"
    }
  ]
}
```

---

### 3. Send Message

**Test This Endpoint**:

```http
POST http://localhost:5000/api/messages
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/messages`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "recipientId": "user_2",
    "content": "Hey! How are you doing?"
  }
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "_id": "msg_3",
    "senderId": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "recipientId": "user_2",
    "content": "Hey! How are you doing?",
    "isRead": false,
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

---

### 4. Mark Message as Read

**Test This Endpoint**:

```http
PUT http://localhost:5000/api/messages/msg_2/read
```

**Postman Setup**:
- **Method**: PUT
- **URL**: `{{base_url}}/api/messages/{{test_message_id}}/read`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Message marked as read",
  "data": {
    "_id": "msg_2",
    "isRead": true
  }
}
```

---

### 5. Send Message with Media

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/messages`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: multipart/form-data
  ```
- **Body** (form-data):
  ```
  recipientId: user_2
  content: Check out this image!
  media: (select image/video file)
  ```

---

## 🤝 Connection Endpoints

### 1. Follow User

**Test This Endpoint**:

```http
POST http://localhost:5000/api/connections/user_2/follow
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/connections/{{test_user_id}}/follow`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "User followed successfully",
  "data": {
    "status": "accepted",
    "followingCount": 129
  }
}
```

---

### 2. Unfollow User

**Test This Endpoint**:

```http
POST http://localhost:5000/api/connections/user_2/unfollow
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/connections/{{test_user_id}}/unfollow`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "User unfollowed successfully",
  "data": {
    "followingCount": 128
  }
}
```

---

### 3. Get Followers

**Test This Endpoint**:

```http
GET http://localhost:5000/api/connections/followers?limit=10&page=1
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/connections/followers?limit=10&page=1`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_2",
      "full_name": "Richard Hendricks",
      "username": "richard_h",
      "profile_picture": "https://...",
      "is_verified": false
    }
  ],
  "pagination": {
    "total": 245,
    "page": 1,
    "limit": 10
  }
}
```

---

### 4. Get Following

**Test This Endpoint**:

```http
GET http://localhost:5000/api/connections/following?limit=10&page=1
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/connections/following?limit=10&page=1`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

---

### 5. Get All Connections

**Test This Endpoint**:

```http
GET http://localhost:5000/api/connections
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/connections`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_2",
      "full_name": "Richard Hendricks",
      "status": "accepted"
    }
  ]
}
```

---

## 📖 Story Endpoints

### 1. Get User Stories

**Test This Endpoint**:

```http
GET http://localhost:5000/api/stories/user_2zdFoZib5lNr614LgkONdD8WG32
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/stories/{{clerk_id}}`

**Expected Response** ✅:
```json
{
  "success": true,
  "data": [
    {
      "_id": "68833d466e4b42b685068860",
      "userId": "user_2zdFoZib5lNr614LgkONdD8WG32",
      "content": "Story content",
      "media_url": "https://...",
      "media_type": "image",
      "background_color": "#4f46e5",
      "expiresAt": "2025-07-26T08:16:00.000Z",
      "createdAt": "2025-07-25T08:16:06.958Z"
    }
  ]
}
```

---

### 2. Create Story

**Test This Endpoint**:

```http
POST http://localhost:5000/api/stories
```

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/stories`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: application/json
  ```
- **Body** (raw JSON - Text Story):
  ```json
  {
    "content": "This is my story! 🌟",
    "media_type": "text",
    "background_color": "#4f46e5"
  }
  ```

**Expected Response** ✅:
```json
{
  "success": true,
  "message": "Story created successfully",
  "data": {
    "_id": "688a4f5c9e2d3c1b8f9a7d6e",
    "userId": "user_2zdFoZib5lNr614LgkONdD8WG32",
    "content": "This is my story! 🌟",
    "media_type": "text",
    "background_color": "#4f46e5",
    "expiresAt": "2025-07-26T10:35:00.000Z",
    "createdAt": "2025-07-25T10:35:00.000Z"
  }
}
```

---

### 3. Create Story with Image

**Postman Setup**:
- **Method**: POST
- **URL**: `{{base_url}}/api/stories`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  Content-Type: multipart/form-data
  ```
- **Body** (form-data):
  ```
  media_type: image
  media: (select image file)
  ```

---

### 4. Get Feed Stories

**Test This Endpoint**:

```http
GET http://localhost:5000/api/stories/feed
```

**Postman Setup**:
- **Method**: GET
- **URL**: `{{base_url}}/api/stories/feed`
- **Headers**:
  ```
  X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32
  ```

---

## ❌ Common Errors & Fixes

### Error 1: 401 Unauthorized

**Message**:
```json
{
  "success": false,
  "message": "No token provided",
  "status": 401
}
```

**Cause**: Missing `X-Clerk-ID` header

**Fix**:
- Add header to request: `X-Clerk-ID: user_2zdFoZib5lNr614LgkONdD8WG32`
- Or add to Postman "Tests" tab:
  ```javascript
  pm.request.headers.add({key: 'X-Clerk-ID', value: 'user_2zdFoZib5lNr614LgkONdD8WG32'})
  ```

---

### Error 2: 404 Not Found

**Message**:
```json
{
  "success": false,
  "message": "User not found",
  "status": 404
}
```

**Cause**: Invalid user ID or endpoint

**Fix**:
- Double-check user ID exists in database
- Verify endpoint URL is correct
- Check MongoDB connection

---

### Error 3: 500 Internal Server Error

**Message**:
```json
{
  "success": false,
  "message": "Internal Server Error",
  "status": 500
}
```

**Cause**: Backend error

**Fix**:
- Check backend console for error details
- Verify database connection
- Check if all required fields are sent
- Restart backend server

---

### Error 4: CORS Error

**Message**:
```
Access to XMLHttpRequest at 'http://localhost:5000/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Cause**: Backend CORS not configured for frontend

**Fix** (in `server.js`):
```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Clerk-ID', 'Authorization']
}));
```

---

### Error 5: Database Connection Error

**Message**:
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Cause**: MongoDB not running

**Fix**:
- Start MongoDB:
  ```bash
  # Windows
  mongod
  
  # macOS
  brew services start mongodb-community
  
  # Linux
  sudo systemctl start mongod
  ```

---

## ✅ Testing Checklist

Use this checklist to ensure all endpoints are working:

### User Endpoints
- [ ] Get user profile
- [ ] Update user profile
- [ ] Search users
- [ ] Get user stats

### Post Endpoints
- [ ] Get feed
- [ ] Create post (text)
- [ ] Create post (with image)
- [ ] Get single post
- [ ] Like post
- [ ] Unlike post
- [ ] Add comment
- [ ] Delete comment
- [ ] Update post
- [ ] Delete post

### Message Endpoints
- [ ] Get conversations
- [ ] Get messages with user
- [ ] Send text message
- [ ] Send message with media
- [ ] Mark message as read
- [ ] Delete message

### Connection Endpoints
- [ ] Follow user
- [ ] Unfollow user
- [ ] Get followers
- [ ] Get following
- [ ] Get all connections

### Story Endpoints
- [ ] Create text story
- [ ] Create image story
- [ ] Get user stories
- [ ] Get feed stories
- [ ] Delete story

### Authentication
- [ ] Test with valid Clerk ID
- [ ] Test without Clerk ID (should fail)
- [ ] Test with invalid Clerk ID (should fail)

### Error Handling
- [ ] Test 401 Unauthorized
- [ ] Test 404 Not Found
- [ ] Test 400 Bad Request
- [ ] Test 500 Server Error

---

## 🔗 Quick Reference: All Endpoints

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---|---------|
| POST | `/api/auth/webhook` | No | Sync Clerk users |
| POST | `/api/auth/logout` | Yes | Logout user |
| GET | `/api/users/profile/:userId` | No | Get user profile |
| PUT | `/api/users/profile/:userId` | Yes | Update profile |
| GET | `/api/users/search` | No | Search users |
| GET | `/api/users/stats/:userId` | No | Get user stats |
| GET | `/api/posts/feed` | No | Get all posts |
| POST | `/api/posts` | Yes | Create post |
| GET | `/api/posts/:postId` | No | Get single post |
| PUT | `/api/posts/:postId` | Yes | Update post |
| DELETE | `/api/posts/:postId` | Yes | Delete post |
| POST | `/api/posts/:postId/like` | Yes | Like post |
| POST | `/api/posts/:postId/unlike` | Yes | Unlike post |
| POST | `/api/posts/:postId/comment` | Yes | Add comment |
| DELETE | `/api/posts/:postId/comment/:commentId` | Yes | Delete comment |
| GET | `/api/messages` | Yes | Get conversations |
| GET | `/api/messages/:userId` | Yes | Get messages with user |
| POST | `/api/messages` | Yes | Send message |
| PUT | `/api/messages/:messageId/read` | Yes | Mark as read |
| DELETE | `/api/messages/:messageId` | Yes | Delete message |
| POST | `/api/connections/:userId/follow` | Yes | Follow user |
| POST | `/api/connections/:userId/unfollow` | Yes | Unfollow user |
| GET | `/api/connections/followers` | Yes | Get followers |
| GET | `/api/connections/following` | Yes | Get following |
| GET | `/api/connections` | Yes | Get connections |
| POST | `/api/stories` | Yes | Create story |
| GET | `/api/stories/:userId` | No | Get user stories |
| GET | `/api/stories/feed` | Yes | Get feed stories |
| DELETE | `/api/stories/:storyId` | Yes | Delete story |

---

## 📚 Next Steps

1. **[Set up Postman](https://www.postman.com/downloads/)** or alternative tool
2. **Import Postman Collection** (see Swagger guide)
3. **Run through testing checklist** above
4. **Start backend server**: `npm run dev`
5. **Test each endpoint** with provided examples
6. **Check frontend integration** (see [FRONTEND_BACKEND_INTEGRATION_GUIDE.md](FRONTEND_BACKEND_INTEGRATION_GUIDE.md))

---

**Happy Testing! 🚀**
