# REST API Fundamentals - Dev Thread Edition

A complete guide to understanding REST APIs with real examples from the Dev Thread social media platform.

---

## Table of Contents

1. [What is REST API?](#what-is-rest-api)
2. [Why Use REST?](#why-use-rest)
3. [HTTP Methods (Verbs)](#http-methods-verbs)
4. [HTTP Status Codes](#http-status-codes)
5. [Request & Response Structure](#request--response-structure)
6. [Authentication & Authorization](#authentication--authorization)
7. [REST Principles](#rest-principles)
8. [Dev Thread API Examples](#dev-thread-api-examples)
9. [Real-World Scenarios](#real-world-scenarios)

---

## What is REST API?

### Breaking Down "REST API"

**REST** = **Representational State Transfer**  
**API** = **Application Programming Interface**

A REST API allows different software applications to communicate over the internet using standardized methods.

### Simple Analogy

Think of a REST API like a **waiter in a restaurant**:

- **You** (Client) = Customer
- **Waiter** (API) = The interface between you and the kitchen
- **Kitchen** (Server/Database) = Where the food is prepared

When you want something:
1. You **order** (make a request with specific instructions)
2. Waiter delivers your order to the kitchen (API processes request)
3. Kitchen prepares food based on your order (Server processes data)
4. Waiter brings back your food (API returns response)

### In Dev Thread Context

When you **like a post**:

```
You (Frontend App)
    ↓ (sends "like this post" request)
Backend API Server
    ↓ (processes request, updates database)
Database (MongoDB)
    ↓ (returns confirmation)
You (Frontend App) - Shows "Liked!" animation
```

---

## Why Use REST?

### 1. **Standardization**
Everyone follows the same rules, making it predictable and easy to understand.

```
GET = Always retrieves data (never changes anything)
POST = Always creates new data
PUT = Always replaces entire resource
DELETE = Always removes data
```

### 2. **Stateless**
Each request contains everything needed - the server doesn't "remember" previous requests.

**Example in Dev Thread:**
```
Request 1: GET /api/users/profile/userId123
Request 2: GET /api/users/profile/userId123

Both requests include all info needed.
Server doesn't say "Oh, you again!" - it treats each as independent.
```

### 3. **Scalability**
Can handle millions of users without complex session management.

```
Dev Thread could have 1 user or 1 million users.
Each request is independent, so servers can be added easily.
```

### 4. **Caching**
Responses can be cached by browsers/CDNs for faster delivery.

```
GET /api/posts/postId - Can be cached
POST /api/posts - Should NOT be cached (creates new data)
```

### 5. **Language Independent**
Frontend (React), Backend (Node.js), Mobile (iOS/Android) all speak the same language.

```
Frontend (JavaScript)  → REST API
Mobile App (Swift)     → REST API  ← All use same endpoints
Web App (Python)       → REST API
```

---

## HTTP Methods (Verbs)

HTTP Methods tell the server **what action** you want to perform.

### 1. GET - Retrieve Data

**What:** Get data without changing anything  
**When:** Viewing content (profiles, posts, messages)  
**Safety:** Safe (doesn't modify data)  
**Idempotent:** Yes (running it 100 times = same result)

**Dev Thread Examples:**
```javascript
// Get user profile
GET /api/users/profile/userId123
Response: { full_name: "John Doe", bio: "...", ... }

// Get feed
GET /api/posts/feed
Response: [{ _id: "123", content: "...", ... }, ...]

// Get messages
GET /api/messages/userId456
Response: [{ senderId: "...", content: "...", ... }, ...]

// Search users
GET /api/users/search?q=john
Response: { users: [...], total: 5 }
```

**Real World Analogy:**
Just looking at a menu without ordering. No state change, just reading.

---

### 2. POST - Create New Data

**What:** Create new resource (user, post, message)  
**When:** Creating/submitting something new  
**Safety:** Not safe (creates data)  
**Idempotent:** No (running it twice = creates 2 resources)

**Dev Thread Examples:**
```javascript
// Create post
POST /api/posts
Headers: { Authorization: "Bearer token" }
Body: { 
  content: "Hello World", 
  media: ["image.jpg"] 
}
Response: 201 Created
  { _id: "newPostId", content: "Hello World", ... }

// Send message
POST /api/messages
Headers: { Authorization: "Bearer token" }
Body: { 
  recipientId: "userId456", 
  content: "Hi there!" 
}
Response: 201 Created
  { _id: "messageId", senderId: "myId", ... }

// Create story
POST /api/stories
Headers: { Authorization: "Bearer token" }
Body: { 
  content: "My story", 
  media_type: "text", 
  background_color: "#FF0000" 
}
Response: 201 Created
  { _id: "storyId", userId: "myId", expiresAt: "..." }
```

**Important:** POST returns **201 Created**, not 200 OK

**Real World Analogy:**
Actually placing an order. You're creating something new that didn't exist before.

---

### 3. PUT - Replace Entire Resource

**What:** Replace entire resource with new data  
**When:** Full update (editing profile)  
**Safety:** Not safe (changes data)  
**Idempotent:** Yes (running it twice = same result)

**Dev Thread Examples:**
```javascript
// Update entire post
PUT /api/posts/postId123
Headers: { Authorization: "Bearer token" }
Body: { 
  content: "Updated content",
  media: ["new-image.jpg"]
}
Response: 200 OK
  { _id: "postId123", content: "Updated content", ... }

// Update profile
PUT /api/users/profile/userId123
Headers: { Authorization: "Bearer token" }
Body: {
  full_name: "Jane Smith",
  bio: "New bio",
  location: "New York"
}
Response: 200 OK
  { _id: "userId123", full_name: "Jane Smith", ... }
```

**Key Difference from PATCH:**
- **PUT** = Replace the ENTIRE resource
- **PATCH** = Update only specific fields

**Real World Analogy:**
Replacing your entire menu order with a completely different order.

---

### 4. DELETE - Remove Data

**What:** Delete resource permanently  
**When:** Removing content (delete post, delete message)  
**Safety:** Not safe (deletes data)  
**Idempotent:** Yes (running twice = already deleted)

**Dev Thread Examples:**
```javascript
// Delete post
DELETE /api/posts/postId123
Headers: { Authorization: "Bearer token" }
Response: 200 OK
  { message: "Post deleted successfully" }

// Delete message
DELETE /api/messages/messageId456
Headers: { Authorization: "Bearer token" }
Response: 200 OK
  { message: "Message deleted successfully" }

// Delete story
DELETE /api/stories/storyId789
Headers: { Authorization: "Bearer token" }
Response: 200 OK
  { message: "Story deleted successfully" }
```

**Real World Analogy:**
Canceling your order. It's gone.

---

## HTTP Status Codes

Status codes tell the client **what happened** with their request.

### 2xx Success Codes

These mean "Success! Everything worked!"

| Code | Name | When Used |
|------|------|-----------|
| **200** | OK | Successful GET, PUT, DELETE |
| **201** | Created | Successful POST (resource created) |
| **204** | No Content | Successful DELETE with no response body |

**Dev Thread Examples:**
```javascript
// 200 OK - Get post successful
GET /api/posts/postId
Response: 200 OK
  { _id: "postId", content: "...", ... }

// 201 Created - Post created successfully
POST /api/posts
Response: 201 Created
  { _id: "newPostId", content: "...", ... }

// 200 OK - Profile updated successfully
PUT /api/users/profile/userId
Response: 200 OK
  { _id: "userId", full_name: "...", ... }
```

---

### 4xx Client Error Codes

These mean "Client made a mistake" (validation, auth, not found, etc.)

| Code | Name | Dev Thread Examples |
|------|------|-----|
| **400** | Bad Request | Invalid post content, missing required fields |
| **401** | Unauthorized | Missing auth token, expired token |
| **403** | Forbidden | Trying to edit someone else's post |
| **404** | Not Found | Post doesn't exist, user not found |

**Dev Thread Examples:**
```javascript
// 400 Bad Request - Empty post content
POST /api/posts
Body: { content: "" }
Response: 400 Bad Request
  { error: "Post content is required" }

// 401 Unauthorized - Missing auth token
POST /api/posts
Body: { content: "Hello" }
Response: 401 Unauthorized
  { error: "No token provided" }

// 403 Forbidden - Trying to edit someone else's post
PUT /api/posts/anotherUsersPost
Headers: { Authorization: "Bearer myToken" }
Response: 403 Forbidden
  { error: "Cannot edit other user posts" }

// 404 Not Found - Post doesn't exist
GET /api/posts/nonExistentId
Response: 404 Not Found
  { error: "Post not found" }
```

---

### 5xx Server Error Codes

These mean "Server had an error" (database down, exception, etc.)

| Code | Name | When |
|------|------|------|
| **500** | Internal Server Error | Unexpected server error, database error |
| **503** | Service Unavailable | Server down for maintenance |

**Dev Thread Examples:**
```javascript
// 500 Internal Server Error - Database connection failed
POST /api/posts
Response: 500 Internal Server Error
  { error: "Failed to create post" }

// 500 Internal Server Error - Image upload service down
POST /api/upload/profile-picture
Response: 500 Internal Server Error
  { error: "Upload failed" }
```

---

## Request & Response Structure

### Request Structure

A REST request has 4 main parts:

```
HTTP METHOD  /api/endpoint
Headers: Key-Value pairs
Body: Data (for POST/PUT)

Example:
POST /api/posts
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGc..."
}
Body: {
  "content": "Hello World",
  "media": ["image.jpg"]
}
```

### Dev Thread Request Examples

**Creating a Post:**
```javascript
POST /api/posts

Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body:
{
  "content": "Just got back from vacation!",
  "media": [
    "vacation1.jpg",
    "vacation2.jpg"
  ]
}
```

**Sending a Message:**
```javascript
POST /api/messages

Headers:
  Content-Type: application/json
  Authorization: Bearer token...

Body:
{
  "recipientId": "user123",
  "content": "Hey, how are you doing?",
  "media_url": null
}
```

**Following a User:**
```javascript
POST /api/connections/user456/follow

Headers:
  Authorization: Bearer token...

Body:
{}  // No body needed for follow action
```

**Searching Users:**
```javascript
GET /api/users/search?q=john&limit=10

Headers:
  Authorization: Bearer token...

Body:
null  // GET requests usually have no body
```

### Response Structure

A REST response has:

```
Status Code (200, 201, 404, etc.)
Headers: Key-Value pairs (Content-Type, etc.)
Body: JSON data or error message

Example:
201 Created
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "_id": "newPostId",
  "content": "Hello World",
  "userId": "user123",
  "createdAt": "2024-06-23T10:30:00Z"
}
```

### Dev Thread Response Examples

**Creating Post Response:**
```javascript
201 Created
{
  "message": "Post created successfully",
  "post": {
    "_id": "newPostId",
    "userId": "user123",
    "content": "Hello World",
    "media": ["image.jpg"],
    "likes": [],
    "comments": [],
    "createdAt": "2024-06-23T10:30:00Z"
  }
}
```

**Error Response:**
```javascript
400 Bad Request
{
  "error": "Post content is required"
}
```

**Feed Response (Multiple Posts):**
```javascript
200 OK
{
  "posts": [
    {
      "_id": "post1",
      "userId": {...},
      "content": "First post",
      "likes": ["user2", "user3"],
      "comments": [...]
    },
    {
      "_id": "post2",
      "userId": {...},
      "content": "Second post",
      "likes": [],
      "comments": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

---

## Authentication & Authorization

These concepts protect your API from unauthorized access.

### Authentication vs Authorization

**Authentication (Who are you?):**
- "Prove you are John Doe"
- Login with username/password
- In Dev Thread: Clerk handles this

```javascript
// Clerk provides token after login
Header: { "Authorization": "Bearer clerk_token" }
```

**Authorization (What can you do?):**
- "You're John, but can you edit Jane's post?"
- Answer: No, you can only edit your own posts
- Checked in middleware

```javascript
// Middleware checks
if (post.userId !== currentUserId) {
  return res.status(403).json({ 
    error: "Cannot edit other user posts" 
  });
}
```

### In Dev Thread Code

**Authentication Middleware:**
```javascript
// middleware/auth.js
export const verifyClerkToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided' 
      });
    }

    // Verify token with Clerk
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

**Authorization Check:**
```javascript
// controllers/postController.js
export const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.userId; // From auth middleware

  const post = await Post.findById(postId);

  // Authorization: Check if user owns post
  if (post.userId.toString() !== userId) {
    return res.status(403).json({ 
      error: 'Cannot delete other user posts' 
    });
  }

  // Safe to delete
  await Post.deleteOne({ _id: postId });
  res.json({ message: 'Post deleted successfully' });
};
```

### Protected vs Public Routes

**Public Routes** (no authentication needed):
```javascript
// Anyone can search users
GET /api/users/search?q=john

// Anyone can get feed
GET /api/posts/feed

// Anyone can get profile
GET /api/users/profile/userId
```

**Protected Routes** (need authentication):
```javascript
// Must be authenticated to create post
POST /api/posts
Header: Authorization: Bearer token

// Must be authenticated to send message
POST /api/messages
Header: Authorization: Bearer token

// Must be authenticated to follow user
POST /api/connections/userId/follow
Header: Authorization: Bearer token
```

---

## REST Principles

REST APIs follow specific design principles:

### 1. **Client-Server Architecture**

Separates concerns between frontend (client) and backend (server).

```
Client (Frontend) → REST API → Server/Database

Dev Thread:
React Frontend → Node.js Backend → MongoDB Database
```

### 2. **Resource-Based URLs**

URLs represent **resources** (nouns), not actions (verbs).

**❌ Bad (RPC style):**
```
GET /api/deletePost?postId=123
GET /api/createPost
POST /api/doLogin
```

**✅ Good (REST style):**
```
DELETE /api/posts/123
POST /api/posts
POST /api/auth/login
```

**Dev Thread Resource-Based URLs:**
```javascript
// Users resource
GET    /api/users/profile/userId        // Get user
PUT    /api/users/profile/userId        // Update user
GET    /api/users/search                // Search users
GET    /api/users/stats/userId          // Get stats

// Posts resource
GET    /api/posts/feed                  // Get posts
POST   /api/posts                       // Create post
GET    /api/posts/postId                // Get post
PUT    /api/posts/postId                // Update post
DELETE /api/posts/postId                // Delete post

// Sub-resources (posts' likes/comments)
POST   /api/posts/postId/like           // Like post
POST   /api/posts/postId/comment        // Comment on post
DELETE /api/posts/postId/comment/commentId  // Delete comment

// Messages resource
GET    /api/messages                    // Get conversations
GET    /api/messages/userId             // Get messages with user
POST   /api/messages                    // Send message
DELETE /api/messages/messageId          // Delete message
```

### 3. **Statelessness**

Each request is independent and contains all needed info.

```javascript
// Request 1 - Server: "I don't remember you"
GET /api/posts/feed
Header: { Authorization: "Bearer token123" }

// Request 2 - Server: "Who are you? I don't remember"
GET /api/users/profile/userId
Header: { Authorization: "Bearer token123" } // Must provide again
```

**Why this is good:**
- Easy to scale (add more servers)
- Easy to cache (each response is independent)
- Fault tolerant (if server crashes, just retry request)

### 4. **Standard HTTP Methods**

Use HTTP methods consistently:

```javascript
// Creating: Always POST
POST /api/posts
POST /api/messages
POST /api/stories

// Reading: Always GET
GET /api/posts/feed
GET /api/users/profile/userId
GET /api/messages

// Updating: POST for state change, PUT for resource replacement
PUT /api/users/profile/userId  // Replace entire user
POST /api/posts/postId/like    // Change: add like (state change)

// Deleting: Always DELETE
DELETE /api/posts/postId
DELETE /api/messages/messageId
DELETE /api/stories/storyId
```

### 5. **Consistent Response Format**

Always return data in same structure:

```javascript
// Success response
{
  "message": "Operation description",
  "data": { /* actual data */ }
}

// Error response
{
  "error": "Error description"
}

// List response with pagination
{
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

---

## Dev Thread API Examples

### Example 1: Creating a Post

**User Action:** User types "Hello World" and clicks "Post"

**Request:**
```javascript
POST /api/posts HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "content": "Hello World",
  "media": []
}
```

**What Happens on Server:**
1. Middleware verifies token → extracts userId
2. Controller validates content (not empty, under 5000 chars)
3. Creates post in database
4. Triggers INNGEST job to notify followers
5. Returns response

**Response:**
```javascript
201 Created
Content-Type: application/json

{
  "message": "Post created successfully",
  "post": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "content": "Hello World",
    "media": [],
    "likes": [],
    "comments": [],
    "createdAt": "2024-06-23T10:30:00Z",
    "updatedAt": "2024-06-23T10:30:00Z"
  }
}
```

**Frontend Receives:**
```javascript
// In React component
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: "Hello World",
    media: []
  })
});

const data = await response.json();
console.log(data.post);  // New post with ID
```

---

### Example 2: Liking a Post

**User Action:** User clicks "Like" button on a post

**Request:**
```javascript
POST /api/posts/507f1f77bcf86cd799439011/like HTTP/1.1
Host: localhost:5000
Authorization: Bearer token...

// No body needed
```

**Server Processing:**
1. Check if user already liked (prevent duplicate)
2. Add userId to post's likes array
3. Send notification to post owner
4. Return updated like count

**Response:**
```javascript
200 OK

{
  "message": "Post liked",
  "likesCount": 5
}
```

**What User Sees:**
- Heart icon fills in red
- Like count increases from 4 to 5
- "You and 4 others liked this"

---

### Example 3: Sending a Message

**User Action:** User types "Hey!" and sends message to John

**Request:**
```javascript
POST /api/messages HTTP/1.1
Host: localhost:5000
Content-Type: application/json
Authorization: Bearer token...

{
  "recipientId": "507f1f77bcf86cd799439013",
  "content": "Hey!",
  "media_url": null
}
```

**Server Processing:**
1. Validate recipient exists
2. Create message in database
3. Emit Socket.IO event to recipient (real-time)
4. Send notification to recipient
5. Return message with timestamp

**Response:**
```javascript
201 Created

{
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "senderId": "507f1f77bcf86cd799439012",
    "recipientId": "507f1f77bcf86cd799439013",
    "content": "Hey!",
    "isRead": false,
    "createdAt": "2024-06-23T10:35:00Z"
  }
}
```

**Real-Time Update:**
- Socket.IO emits event to John's browser
- Message appears instantly without page reload
- Browser notification shows "New message from Jane"

---

### Example 4: Following a User

**User Action:** User clicks "Follow" button on Jane's profile

**Request:**
```javascript
POST /api/connections/507f1f77bcf86cd799439013/follow HTTP/1.1
Host: localhost:5000
Authorization: Bearer token...

// No body needed
```

**Server Processing:**
1. Check if already following
2. Add Jane to user's "following" list
3. Add user to Jane's "followers" list
4. Create connection record
5. Send notification to Jane

**Response:**
```javascript
201 Created

{
  "message": "User followed successfully",
  "connection": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439012",
    "targetUserId": "507f1f77bcf86cd799439013",
    "status": "accepted",
    "createdAt": "2024-06-23T10:40:00Z"
  }
}
```

**What User Sees:**
- "Follow" button changes to "Following"
- Jane gets notification "John started following you"
- John now sees Jane's posts in feed

---

### Example 5: Searching Users

**User Action:** User types "john" in search box

**Request:**
```javascript
GET /api/users/search?q=john&limit=10 HTTP/1.1
Host: localhost:5000
Authorization: Bearer token...
```

**Server Processing:**
1. Create regex pattern for "john" (case-insensitive)
2. Search database for matching users
3. Limit results to 10
4. Return user profiles (without sensitive data)

**Response:**
```javascript
200 OK

{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "full_name": "John Doe",
      "username": "johndoe",
      "profile_picture": "https://...",
      "bio": "Software engineer"
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "full_name": "John Smith",
      "username": "johnsmith",
      "profile_picture": "https://...",
      "bio": "Designer"
    }
  ],
  "total": 2,
  "hasMore": false
}
```

**Frontend Displays:**
User sees list of profiles matching "john" with pictures and bios.

---

## Real-World Scenarios

### Scenario 1: User Deletes Their Post

**What User Expects:**
1. Click delete
2. Confirmation dialog
3. Post disappears
4. Success message

**Backend Steps:**

```javascript
// Step 1: User clicks delete
DELETE /api/posts/postId123
Header: { Authorization: "Bearer token" }

// Step 2: Server checks authorization
if (post.userId !== currentUserId) {
  return 403 "Cannot delete other user posts"
}

// Step 3: Delete from database
await Post.deleteOne({ _id: postId123 });

// Step 4: Notify INNGEST to cleanup related data
await inngest.send({
  name: 'post.deleted',
  data: { postId: postId123 }
});

// Step 5: Return success
return 200 OK { message: "Post deleted successfully" }

// Step 6: Frontend removes post from UI
```

---

### Scenario 2: User Receives Message While App Open

**What User Expects:**
- Message appears instantly
- Notification badge appears
- No page refresh needed

**Backend Steps:**

```javascript
// Step 1: Sender sends message
POST /api/messages
{ recipientId: "userId", content: "Hi!" }

// Step 2: Server saves message to database
await Message.create({ ... });

// Step 3: Server emits real-time event via Socket.IO
io.to(`user-${recipientId}`).emit('message:new', {
  senderId: "...",
  content: "Hi!",
  timestamp: "..."
});

// Step 4: Server sends notification
await sendNotification(
  recipientId,
  "New message from John",
  "message-123",
  "/messages/john"
);

// Step 5: User's browser receives Socket.IO event
socket.on('message:new', (message) => {
  // Update message list in real-time
  setMessages([...messages, message]);
});
```

---

### Scenario 3: User Uploads Profile Picture

**What User Expects:**
1. Select image
2. Show loading spinner
3. Image uploads
4. Profile updates

**Backend Steps:**

```javascript
// Step 1: Frontend sends image to upload endpoint
POST /api/upload/profile-picture
Header: { Authorization: "Bearer token" }
Body: FormData with file

// Step 2: Server receives file via multer
const file = req.file;

// Step 3: Upload to ImageKit (CDN)
const response = await imageKit.upload({
  file: file.buffer,
  fileName: `profile-${userId}`,
  folder: '/dev-thread/profile-pictures'
});

// Step 4: Save ImageKit URL to database
await User.updateOne(
  { _id: userId },
  { profile_picture: response.url }
);

// Step 5: Return optimized image URL
return {
  url: response.url,
  optimized: getOptimizedImageUrl(response.url, { width: 200 })
};

// Step 6: Frontend updates profile picture
setProfilePicture(data.url);
```

---

### Scenario 4: User Gets Feed

**What User Expects:**
1. Open app
2. See posts from people they follow
3. Ability to scroll (infinite scroll/pagination)

**Backend Steps:**

```javascript
// Step 1: Frontend requests feed (page 1, 10 posts per page)
GET /api/posts/feed?page=1&limit=10
Header: { Authorization: "Bearer token" }

// Step 2: Server gets user's following list
const user = await User.findById(userId)
  .select('following');

// Step 3: Query posts from following + own posts
const posts = await Post.find({
  userId: { $in: [...user.following, userId] }
})
  .populate('userId')
  .populate('comments.userId')
  .sort({ createdAt: -1 })
  .limit(10)
  .skip(0);

// Step 4: Count total for pagination
const total = await Post.countDocuments({...});

// Step 5: Return posts with pagination info
return {
  posts: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 42,
    pages: 5
  }
};

// Step 6: Frontend displays posts, enables pagination
// When user scrolls to bottom:
//   GET /api/posts/feed?page=2&limit=10
```

---

## Summary

### Key Takeaways

| Concept | What | Why | How |
|---------|------|-----|-----|
| **REST** | Architectural style | Standardized, predictable | Use HTTP methods & resources |
| **GET** | Retrieve data | Safe, cacheable | `GET /api/resource` |
| **POST** | Create data | Creates new resource | `POST /api/resource` with body |
| **PUT** | Replace resource | Full update | `PUT /api/resource/id` with body |
| **DELETE** | Remove data | Removes resource | `DELETE /api/resource/id` |
| **Status Codes** | Response result | Inform client of outcome | 2xx (success), 4xx (client error), 5xx (server error) |
| **Auth** | Verify identity | Protect endpoints | Token in Authorization header |
| **Authorization** | Check permissions | Prevent unauthorized access | Middleware checks ownership |
| **Resources** | URL-based entities | Clear API structure | `/api/users`, `/api/posts` |

### Dev Thread API Pattern

```javascript
// Create
POST /api/[resource]
{ data }
→ 201 Created

// Read
GET /api/[resource]/[id]
→ 200 OK { data }

// Update
PUT /api/[resource]/[id]
{ updated data }
→ 200 OK { data }

// Delete
DELETE /api/[resource]/[id]
→ 200 OK { message }

// List
GET /api/[resource]?page=1&limit=10
→ 200 OK { data: [], pagination: {...} }

// Action (state change)
POST /api/[resource]/[id]/[action]
→ 200 OK { result }
```

---

## Next Steps

1. **Review** the COMPLETE_BACKEND_IMPLEMENTATION.md file with all the controllers
2. **Implement** each endpoint using the patterns shown here
3. **Test** endpoints using the provided CURL examples
4. **Understand** how each endpoint uses REST principles

Good luck with your Dev Thread backend!
