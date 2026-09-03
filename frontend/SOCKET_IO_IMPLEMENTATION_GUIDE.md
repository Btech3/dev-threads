# Socket.io Real-Time Integration - Quick Action Guide

## Current Status
✅ Frontend Feed Component: **COMPLETE** - All buttons wired, state management done, ready for real-time events
⏳ Backend Socket.io Emissions: **REQUIRED** - Controllers exist but don't emit events

---

## What Needs to Happen Next

### Step 1: Add Socket.io Emit to postController.js

Each engagement method needs to broadcast an event to all connected clients.

#### Template Pattern:
```javascript
async likePost(req, res) {
  try {
    // ... existing code ...
    
    // EMIT SOCKET EVENT - ADD THIS
    req.app.get('io').to('feed').emit('post:liked', {
      postId: post._id,
      userId: req.userId,
      likeCount: post.likeCount,
      post: populatedPost // Send full updated post
    });
    
    return res.status(200).json({ post: populatedPost });
  } catch (error) {
    // ... error handling ...
  }
}
```

---

## Implementation Checklist

### postController Methods to Update:

#### 1. **likePost()** - After post is liked
```javascript
req.app.get('io').to('feed').emit('post:liked', {
  postId: post._id,
  userId: req.userId,
  likeCount: post.likeCount,
  post: populatedPost
});
```

#### 2. **unlikePost()** - After post is unliked
```javascript
req.app.get('io').to('feed').emit('post:unliked', {
  postId: post._id,
  userId: req.userId,
  likeCount: post.likeCount,
  post: populatedPost
});
```

#### 3. **commentPost()** - After comment added
```javascript
req.app.get('io').to('feed').emit('post:commented', {
  postId: post._id,
  commentCount: post.commentCount,
  comment: newComment,
  post: populatedPost
});
```

#### 4. **deleteComment()** - After comment deleted
```javascript
req.app.get('io').to('feed').emit('post:comment-deleted', {
  postId: post._id,
  commentId: commentId,
  commentCount: post.commentCount,
  post: populatedPost
});
```

#### 5. **sharePost()** - After post shared
```javascript
req.app.get('io').to('feed').emit('post:shared', {
  postId: post._id,
  shareCount: post.shareCount,
  post: populatedPost
});
```

#### 6. **bookmarkPost()** - After post bookmarked
```javascript
req.app.get('io').to('feed').emit('post:bookmarked', {
  postId: post._id,
  bookmarkCount: post.bookmarkCount,
  post: populatedPost
});
```

#### 7. **removeBookmark()** - After bookmark removed
```javascript
req.app.get('io').to('feed').emit('post:bookmark-removed', {
  postId: post._id,
  bookmarkCount: post.bookmarkCount,
  post: populatedPost
});
```

---

## Frontend Socket Listeners (Already in Feed)

These listeners are **already configured** in Feed component, just need backend to emit:

```javascript
socketService.on('post:liked', (data) => {
  // Updates will come through here when backend emits
});

socketService.on('post:unliked', (data) => {
  // Updates will come through here when backend emits
});

// ... etc for all engagement events
```

---

## Quick Reference: Socket.io Structure

### Room Name
```javascript
'feed'  // Broadcast to all users viewing the feed
```

### Event Names (Frontend Listens)
- `post:liked` - User liked a post
- `post:unliked` - User unliked a post
- `post:commented` - User added a comment
- `post:comment-deleted` - User deleted a comment
- `post:shared` - User shared a post
- `post:bookmarked` - User bookmarked a post
- `post:bookmark-removed` - User removed bookmark
- `post:created` - User created a new post (ALREADY DONE)

### Event Payload Structure
```javascript
{
  postId: string,           // Which post was affected
  userId: string,           // Who did the action
  likeCount?: number,       // Updated count
  commentCount?: number,    // Updated count
  shareCount?: number,      // Updated count
  bookmarkCount?: number,   // Updated count
  post: object,             // Full updated post object
  comment?: object,         // New comment (for post:commented)
  commentId?: string        // Comment ID (for post:comment-deleted)
}
```

---

## Testing Socket.io Events

### 1. Start Backend (Port 5234)
```bash
cd dev-thread-backend
npm start
```

### 2. Start Frontend (Port 5175)
```bash
cd .
npm run dev
```

### 3. Open Browser DevTools → Network → WebSocket
Look for Socket.io connection: `ws://localhost:5234/socket.io/`

### 4. Test Each Action
- [ ] Like post → should emit `post:liked`
- [ ] Unlike post → should emit `post:unliked`
- [ ] Add comment → should emit `post:commented`
- [ ] Share post → should emit `post:shared`
- [ ] Bookmark post → should emit `post:bookmarked`

### 5. Verify Socket Messages
- Check WebSocket tab in DevTools
- Should see events flowing back and forth
- Real-time counts should update instantly

---

## Expected Behavior After Implementation

### Before Socket.io
1. User clicks like button
2. Button disables (loading state)
3. API request sent to backend
4. Response received
5. UI updates for that user only
6. Other users don't see the update

### After Socket.io
1. User clicks like button
2. Button disables (loading state)
3. API request sent to backend
4. Backend updates database
5. Backend emits `post:liked` event to all connected clients
6. **ALL users** instantly see the updated like count
7. This creates the "real-time" effect

---

## Code Location

### File to Edit
`dev-thread-backend/controllers/postController.js`

### Methods to Update (in order of priority)
1. **likePost()** - Line ~140
2. **unlikePost()** - Line ~160
3. **commentPost()** - Line ~180 (named addComment)
4. **deleteComment()** - Line ~220
5. **sharePost()** - Line ~260
6. **bookmarkPost()** - Line ~300
7. **removeBookmark()** - Line ~340

---

## Verification Checklist

After implementing Socket.io emissions:

- [ ] Backend compiles without errors
- [ ] Socket.io connection established in browser
- [ ] WebSocket shows `post:liked` event in network tab
- [ ] Feed component receives event via socketService
- [ ] Like count updates in real-time for all users
- [ ] Comments update in real-time
- [ ] Shares update in real-time
- [ ] Bookmarks update in real-time
- [ ] No console errors
- [ ] No memory leaks (listeners properly cleaned up)

---

## Performance Tips

1. **Broadcast to Specific Room**: Use `'feed'` room to only notify feed viewers
2. **Send Only Changed Data**: Include the updated post object
3. **Avoid Duplicate Events**: Only emit on successful database updates
4. **Handle Offline**: Frontend already has offline detection with `isOnline` state

---

## Troubleshooting

### Event Not Received?
1. Check Socket.io connection in DevTools Network tab
2. Verify `io.to('feed').emit()` is called
3. Check browser console for socket errors
4. Verify socketService.on() listeners registered

### Real-time Counts Not Updating?
1. Verify event payload includes updated counts
2. Check Feed component is listening to correct event name
3. Verify posts state is being updated
4. Check engagement state update

### Broadcast Not Going to All Users?
1. Ensure using `io.to('feed').emit()` not just `emit()`
2. Verify all clients join 'feed' room (check socketService.js)
3. Check no middleware is blocking the event

---

## Next Phase: Advanced Real-Time

Once Socket.io is working:
- [ ] Add comment nested replies
- [ ] Real-time user status (online/offline)
- [ ] Typing indicators
- [ ] User mention notifications
- [ ] Real-time message notifications
- [ ] Activity feed (who's posting, liking, commenting)

---

## Quick Command Reference

```bash
# Start backend with Socket.io
cd dev-thread-backend && npm start

# Start frontend
npm run dev

# Check Socket.io in DevTools
F12 → Network → WS → socket.io

# Test API without Socket.io
curl -X POST http://localhost:5234/api/posts/[postId]/like \
  -H "Authorization: Bearer [token]" \
  -H "x-clerk-id: [clerkId]"
```

---

## Success Criteria

✅ Real-time engagement implementation is **COMPLETE** when:

1. ✅ Backend emits Socket.io events for all 7 actions
2. ✅ Frontend Feed listens to and handles all events
3. ✅ Live engagement counts update across multiple browser tabs
4. ✅ Comments appear instantly for all users
5. ✅ No lag or delay in real-time updates
6. ✅ Offline detection prevents event errors
7. ✅ No memory leaks or zombie listeners

---

## Time Estimate

- Implementing Socket.io emissions: **10-15 minutes**
- Testing and verification: **5-10 minutes**
- **Total: ~20-25 minutes** ⏱️

---

## Questions?

Refer to:
- [Feed Component Documentation](./FEED_COMPONENT_DOCUMENTATION.md)
- [Complete Implementation Report](./FEED_IMPLEMENTATION_COMPLETE.md)
- Socket.io Docs: https://socket.io/docs/
- Express Socket.io Integration: https://socket.io/docs/v4/express/
