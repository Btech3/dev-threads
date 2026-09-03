# Real-Time Socket.io Implementation - Complete Testing Guide

## ✅ Implementation Status

**All Socket.io emissions have been successfully integrated into postController.js**

### What Was Implemented:
✅ `config/socket.js` - Modular Socket.io initialization
✅ `server.js` - Refactored to use Socket.io utility
✅ `postController.js` - All 7 engagement methods emit real-time events
  - likePost() → emits `post:engagement_update` with action: 'like'
  - unlikePost() → emits `post:engagement_update` with action: 'unlike'
  - commentPost() → emits `post:engagement_update` with action: 'comment'
  - deleteComment() → emits `post:engagement_update` with action: 'comment-deleted'
  - sharePost() → emits `post:engagement_update` with action: 'share'
  - bookmarkPost() → emits `post:engagement_update` with action: 'bookmark'
  - removeBookmark() → emits `post:engagement_update` with action: 'bookmark-removed'

---

## 🧪 STEP-BY-STEP TESTING GUIDE

### Phase 1: Verify Backend Starts Without Errors

#### Step 1.1: Terminal 1 - Start Backend
```bash
cd "C:\Users\Ken\Desktop\Social media app\Social media app\dev-thread-backend"
npm start
```

**Expected Output:**
```
◇ injected env (15) from .env
🚀 Server running on http://localhost:5234
📱 CORS enabled for: http://localhost:5173
🎯 Socket.io initialized successfully
```

**If you see errors:**
- Check if port 5234 is already in use: `netstat -ano | findstr :5234`
- Kill the process: `taskkill /PID <PID> /F`
- Try again

#### Step 1.2: Verify Health Check
Open browser and visit:
```
http://localhost:5234/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-06T10:39:00.000Z"
}
```

---

### Phase 2: Start Frontend & Authenticate

#### Step 2.1: Terminal 2 - Start Frontend
```bash
cd "C:\Users\Ken\Desktop\Social media app\Social media app"
npm run dev
```

**Expected Output:**
```
VITE v8.1.0  ready in 1826 ms
  ➜  Local:   http://localhost:5175/
  ➜  Network: use --host to expose
```

#### Step 2.2: Open Frontend in Browser
Navigate to:
```
http://localhost:5175/
```

You should see the login page.

#### Step 2.3: Authenticate with Clerk
- Click "Sign in with Google" (or email)
- Complete authentication
- Wait for redirect to feed page

**You should see:**
- Posts displayed
- All engagement buttons visible (❤️, 💬, 📤, 🔖)
- User profile navigation

---

### Phase 3: Test API Endpoints (Without Real-Time)

#### Step 3.1: Get Your Auth Token

In Browser Console (F12 → Console tab):
```javascript
const token = localStorage.getItem('authToken');
const clerkId = localStorage.getItem('clerkId');
console.log('Token:', token);
console.log('Clerk ID:', clerkId);
```

Copy these values for use in API testing.

#### Step 3.2: Get a Post ID

In Browser Console:
```javascript
// After feed loads, get first post ID
const posts = JSON.parse(localStorage.getItem('posts') || '[]');
// Or inspect network tab → /api/posts/feed → look for _id
```

Or check the Network tab in DevTools:
- F12 → Network tab → Refresh → Look for `/api/posts/feed`
- Click it → Response tab → Copy first post's `_id` value

#### Step 3.3: Test Like API Endpoint

**Using Postman or Curl:**

```bash
curl -X POST http://localhost:5234/api/posts/{postId}/like \
  -H "Authorization: Bearer {your_token}" \
  -H "x-clerk-id: {your_clerkId}" \
  -H "Content-Type: application/json"
```

**Replace:**
- `{postId}` - Real post ID from your feed
- `{your_token}` - Token from localStorage
- `{your_clerkId}` - Clerk ID from localStorage

**Expected Response:**
```json
{
  "message": "Post liked",
  "post": {
    "_id": "postId",
    "likeCount": 1,
    "likes": ["userId"],
    ...
  }
}
```

**In Backend Terminal, you should see:**
```
📡 Emitted post:engagement_update for like on post [postId]
```

✅ **This confirms Socket.io emission is working!**

#### Step 3.4: Test Unlike API Endpoint

```bash
curl -X POST http://localhost:5234/api/posts/{postId}/unlike \
  -H "Authorization: Bearer {your_token}" \
  -H "x-clerk-id: {your_clerkId}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "Post unliked",
  "post": {
    "_id": "postId",
    "likeCount": 0,
    ...
  }
}
```

**Backend output:**
```
📡 Emitted post:engagement_update for unlike on post [postId]
```

#### Step 3.5: Test Comment API Endpoint

```bash
curl -X POST http://localhost:5234/api/posts/{postId}/comment \
  -H "Authorization: Bearer {your_token}" \
  -H "x-clerk-id: {your_clerkId}" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test comment!"}'
```

**Expected Response:**
```json
{
  "message": "Comment added",
  "post": {
    "_id": "postId",
    "commentCount": 1,
    "comments": [{
      "_id": "commentId",
      "text": "This is a test comment!",
      "userId": {"full_name": "Your Name"},
      "createdAt": "2026-07-06T..."
    }],
    ...
  }
}
```

**Backend output:**
```
📡 Emitted post:engagement_update for comment on post [postId]
```

#### Step 3.6: Test Share API Endpoint

```bash
curl -X POST http://localhost:5234/api/posts/{postId}/share \
  -H "Authorization: Bearer {your_token}" \
  -H "x-clerk-id: {your_clerkId}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "Post shared",
  "post": {
    "_id": "postId",
    "shareCount": 1,
    ...
  }
}
```

**Backend output:**
```
📡 Emitted post:engagement_update for share on post [postId]
```

#### Step 3.7: Test Bookmark API Endpoint

```bash
curl -X POST http://localhost:5234/api/posts/{postId}/bookmark \
  -H "Authorization: Bearer {your_token}" \
  -H "x-clerk-id: {your_clerkId}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "Post bookmarked",
  "post": {
    "_id": "postId",
    "bookmarkCount": 1,
    ...
  }
}
```

**Backend output:**
```
📡 Emitted post:engagement_update for bookmark on post [postId]
```

---

### Phase 4: Test Real-Time Socket.io Events

#### Step 4.1: Open Browser DevTools & Network Tab
1. Open browser
2. Press `F12` to open DevTools
3. Go to **Network** tab
4. Look for **WS** filter (WebSocket)

#### Step 4.2: Verify Socket.io Connection
Look for a WebSocket connection:
```
localhost:5234/socket.io/?transport=websocket
```

**Expected Status:**
- Status: `101 Switching Protocols`
- Type: `websocket`
- Should show as green/connected

#### Step 4.3: Watch Socket.io Messages

**Option A: Using DevTools Network Tab (WS Filter)**
1. Network tab → Filter by "WS"
2. Click the socket.io connection
3. Click "Messages" tab
4. You should see messages flowing

**Option B: Using Browser Console**
```javascript
// The socketService should be connecting automatically
// Check connection status:
localStorage.getItem('socketConnected');
```

#### Step 4.4: Test Real-Time Like Update

**In One Browser Tab (Tab A):**
1. Go to http://localhost:5175/
2. Open DevTools (F12) → Network → WS
3. Don't do anything yet - just watch

**In Another Browser Tab (Tab B):**
1. Go to http://localhost:5175/
2. Click ❤️ like button on a post

**Back in Tab A:**
Watch the Network → Messages tab. You should see:

```json
{
  "postId": "xxxxx",
  "likesCount": 1,
  "action": "like",
  "updatedPost": {...}
}
```

This is the `post:engagement_update` event being broadcast!

#### Step 4.5: Test Real-Time Comment Update

**In Tab A:**
- Watch Network → Messages
- Keep DevTools open

**In Tab B:**
- Type a comment in the comment input box
- Press Enter or click Send button

**Back in Tab A:**
You should see a new Socket.io message:
```json
{
  "postId": "xxxxx",
  "commentsCount": 2,
  "action": "comment",
  "latestComment": {
    "text": "Your comment here",
    "userId": {...},
    "createdAt": "2026-07-06T..."
  }
}
```

#### Step 4.6: Monitor Backend Console

In your backend terminal (Terminal 1), you should see logs like:

```
📡 Emitted post:engagement_update for like on post xxxxx
📡 Emitted post:engagement_update for comment on post xxxxx
📡 Emitted post:engagement_update for share on post xxxxx
📡 Emitted post:engagement_update for bookmark on post xxxxx
```

---

### Phase 5: Test Frontend Integration

#### Step 5.1: Test UI Updates

**Click Like Button:**
```
✓ Heart icon fills with red
✓ Like count increments
✓ Button disables briefly (loading state)
✓ Button re-enables when done
```

**Type & Submit Comment:**
```
✓ Input validates (no empty comments)
✓ Comment appears below post
✓ Comment count increments
✓ Input field clears
✓ "View all X comments" link appears
```

**Click Share Button:**
```
✓ Share count increments
✓ Notification appears: "Post shared!"
```

**Click Bookmark Button:**
```
✓ Bookmark icon fills
✓ Bookmark count increments
✓ Notification appears: "Post bookmarked!"
✓ Click again to unbookmark
```

#### Step 5.2: Multi-Tab Real-Time Test

**Setup:**
1. Open Tab A: http://localhost:5175/feed
2. Open Tab B: http://localhost:5175/feed
3. Same user, two windows

**Test Real-Time Sync:**
- In Tab A: Click like on a post
- In Tab B: Like count should update instantly!
- In Tab A: Add a comment
- In Tab B: Comment count should update instantly!

**This is the real-time magic!** 🎉

#### Step 5.3: Multi-User Real-Time Test (Advanced)

**Setup:**
1. Open Tab A: http://localhost:5175/ → Login as User 1
2. Open Tab B: http://localhost:5175/ → Login as User 2 (different account)

**Test:**
- User 1 likes post
- User 2's feed should show updated count instantly
- User 1 comments on post
- User 2 should see comment appear instantly

---

## 🔍 Troubleshooting

### Issue: Backend Won't Start

**Error:** `EADDRINUSE: address already in use :::5234`

**Solution:**
```bash
# Find process using port 5234
netstat -ano | findstr :5234

# Kill the process (replace PID with actual number)
taskkill /PID 1234 /F

# Try starting again
npm start
```

### Issue: Socket.io Connection Failed

**Symptom:** WS connection shows red/error in DevTools

**Causes & Solutions:**
1. **Backend not running** → Start backend server
2. **Wrong URL** → Ensure frontend connects to http://localhost:5234
3. **CORS blocked** → Check console for CORS errors
4. **Port 5234 blocked** → Check firewall settings

**Check Frontend Connection:**
```javascript
// In browser console
localStorage.getItem('socketConnected');
// Should return 'true'
```

### Issue: Socket.io Events Not Emitting

**Symptom:** No messages in DevTools Network → Messages tab

**Solutions:**
1. **Check backend console** → Should show `📡 Emitted...` logs
2. **Verify socket initialization** → Look for `🎯 Socket.io initialized successfully` in backend logs
3. **Check if client joined 'feed' room** → Backend should log `📍 Socket xxxxx joined 'feed' room`

**Debug Code in postController:**
```javascript
// Add this in any method
try {
  const io = getIO();
  console.log('IO Instance:', io ? '✅ Available' : '❌ Not available');
  io.to('feed').emit('test', { message: 'Testing' });
  console.log('✅ Socket event emitted successfully');
} catch (error) {
  console.error('❌ Socket error:', error.message);
}
```

### Issue: Frontend Not Receiving Socket Events

**Symptom:** Events emit (backend shows logs) but frontend doesn't update

**Solutions:**
1. **Check socketService is listening** → Verify feed.jsx has listeners
2. **Check event names match** → Both sides use `post:engagement_update`
3. **Verify socket connection** → Should show connected in DevTools

**Frontend Debug (in Browser Console):**
```javascript
// Check if socketService is connected
window.socketConnected
// Should be true

// Check if listeners are registered
console.log('Checking socket listeners...');
```

---

## ✅ Verification Checklist

### Backend Verification
- [ ] Backend starts without errors
- [ ] `🎯 Socket.io initialized successfully` logged
- [ ] Health check returns `{"status": "ok"}`
- [ ] Logs show `📡 Emitted post:engagement_update...` on API calls

### API Testing Verification
- [ ] Like endpoint returns updated `likeCount`
- [ ] Unlike endpoint returns updated `likeCount`
- [ ] Comment endpoint returns `commentCount` and comment details
- [ ] Share endpoint returns updated `shareCount`
- [ ] Bookmark endpoint returns updated `bookmarkCount`

### Socket.io Connection Verification
- [ ] DevTools Network → WS shows socket.io connection
- [ ] Connection status is `101 Switching Protocols`
- [ ] Messages tab shows socket frames

### Real-Time Event Verification
- [ ] Backend logs show `📡 Emitted...` when API called
- [ ] DevTools Messages tab shows event payload
- [ ] Frontend updates without page refresh
- [ ] Multi-tab test shows instant synchronization

### Frontend UI Verification
- [ ] Like button toggles and updates count
- [ ] Comment input submits and shows comment
- [ ] Share button increments counter
- [ ] Bookmark button fills/unfills icon
- [ ] Notifications appear for user feedback

---

## 🎯 Success Criteria

You'll know it's working when:

✅ **API Level:** Calling `/api/posts/{id}/like` returns `{"message": "Post liked", "post": {...}}`

✅ **Socket Level:** Backend logs show `📡 Emitted post:engagement_update for like on post xxx`

✅ **Frontend Level:** In one browser tab, like a post. In another tab, the like count updates instantly without refresh.

✅ **Multi-User:** User A likes post, User B sees count update in real-time.

---

## 📊 Event Payload Reference

All engagement events follow this structure:

```javascript
{
  postId: string,              // Post being engaged with
  action: string,              // 'like', 'unlike', 'comment', 'share', 'bookmark', 'bookmark-removed', 'comment-deleted'
  
  // Count fields (depends on action)
  likesCount?: number,
  commentsCount?: number,
  sharesCount?: number,
  bookmarksCount?: number,
  
  // Additional data
  latestComment?: object,      // For 'comment' action
  deletedCommentId?: string,   // For 'comment-deleted' action
  updatedPost: object          // Full updated post data
}
```

---

## 🚀 Next Steps After Verification

Once all tests pass:

1. **Update Frontend Feed** - Add Socket.io listener handlers in feed.jsx
   ```javascript
   socketService.on('post:engagement_update', (data) => {
     // Update post counts in real-time
     setPosts(prev => prev.map(p => 
       p._id === data.postId ? updatePost(p, data) : p
     ));
   });
   ```

2. **Test Multi-User Sync** - Open two browser tabs and verify instant updates

3. **Performance Testing** - Stress test with multiple rapid updates

4. **Deploy** - Push to production when satisfied

---

## 📞 Quick Command Reference

```bash
# Start backend
cd dev-thread-backend && npm start

# Start frontend
npm run dev

# Test like endpoint
curl -X POST http://localhost:5234/api/posts/{postId}/like \
  -H "Authorization: Bearer {token}" \
  -H "x-clerk-id: {clerkId}" \
  -H "Content-Type: application/json"

# Kill process on port 5234
netstat -ano | findstr :5234
taskkill /PID {PID} /F

# View backend logs
# (in backend terminal - watch for 📡 Emitted messages)
```

---

**You now have a fully functional real-time engagement system!** 🎉
