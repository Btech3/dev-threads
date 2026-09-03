# Quick Testing Guide - Create Post Feature

## Prerequisites
1. Backend running: `npm run dev` in `dev-thread-backend/` folder
2. Frontend running: `npm run dev` in project root folder
3. Logged in with Clerk authentication
4. Both services are on localhost:5234 (backend) and localhost:5173 (frontend)

## Step-by-Step Test

### Test 1: Text-Only Post
1. Navigate to `/createpost`
2. Write some text in the textarea
3. Click "Publish Post"
4. **Expected**: Success message appears, form clears, can create another post
5. **Not Expected**: Auto-redirect to feed

### Test 2: Post with Image
1. Navigate to `/createpost`
2. Write some text
3. Click "Add Media" button
4. Select an image file (JPG, PNG, GIF, WEBP)
5. Verify image preview shows
6. Click "Publish Post"
7. **Expected**: Post published, image included, success message

### Test 3: Post with Video
1. Navigate to `/createpost`
2. Write some text
3. Click "Add Media"
4. Select a video file (MP4, WEBM, MOV)
5. Verify video preview shows
6. Click "Publish Post"
7. **Expected**: Post published, video included

### Test 4: Multiple Media
1. Navigate to `/createpost`
2. Write text
3. Add up to 5 files (mix of images and videos)
4. Verify counter shows "x/5"
5. Click "Publish Post"
6. **Expected**: All files uploaded

### Test 5: Real-Time Feed Update
1. Open Create Post in Tab 1
2. Open Feed in Tab 2
3. Create post in Tab 1
4. **Expected**: Post appears in Tab 2 Feed in real-time (no refresh needed)

### Test 6: Error Handling
Try these error scenarios:

a) **File too large**
   - Try uploading file > 10MB
   - Expected: Error message about file size

b) **Too many files**
   - Try uploading 6+ files
   - Expected: Error message "Maximum 5 files"

c) **Wrong file type**
   - Try uploading .exe or .txt file
   - Expected: File rejected by backend

d) **Empty post**
   - Click "Publish Post" with no content
   - Expected: Error "Post content is required"

## Troubleshooting

### If you see "Failed to fetch"
1. Check if backend is running on 5234
2. Check browser DevTools Network tab
3. Look for 401 Unauthorized - means auth headers missing
4. Look for CORS error - means backend CORS not configured

### If Socket.io events don't work
1. Check Network tab > WS (WebSocket) tab
2. Verify connection to localhost:5234
3. Check browser Console for socket errors
4. Refresh page and check if 'join-feed' event fires

### If images/videos don't show in post
1. Check backend `uploads/posts` folder exists
2. Check file was actually uploaded (check network tab)
3. Verify file path in post response
4. Check backend has write permissions

## Success Indicators

✅ Post publishes successfully
✅ Form clears after publish
✅ Success message shows for 3 seconds
✅ Can create multiple posts without page refresh
✅ Files upload and show in preview
✅ New posts appear in feed in real-time
✅ No 401 authorization errors
✅ No console JavaScript errors
✅ File size validation works
✅ File type validation works

## API Response Examples

### Successful Create Post Response
```json
{
  "message": "Post created successfully",
  "success": true,
  "post": {
    "_id": "6xxxxxxxxxxxxx",
    "userId": {
      "_id": "user_xxx",
      "full_name": "John Warren",
      "username": "john_warren",
      "profile_picture": "..."
    },
    "content": "This is my post content",
    "media": [
      {
        "type": "image",
        "url": "/uploads/posts/1234567890-image.jpg",
        "mimetype": "image/jpeg",
        "size": 1024000,
        "uploadedAt": "2026-07-07T10:23:19.000Z"
      }
    ],
    "likes": [],
    "comments": [],
    "shares": [],
    "bookmarks": [],
    "createdAt": "2026-07-07T10:23:19.000Z",
    "updatedAt": "2026-07-07T10:23:19.000Z"
  },
  "mediaCount": 1,
  "timestamp": "2026-07-07T10:23:19.000Z"
}
```

### Socket.io Event (Real-Time)
```json
{
  "postId": "6xxxxxxxxxxxxx",
  "action": "post_created",
  "createdBy": {
    "userId": "user_xxx",
    "full_name": "John Warren",
    "profile_picture": "...",
    "username": "john_warren"
  },
  "post": { /* full post object */ },
  "timestamp": "2026-07-07T10:23:19.000Z"
}
```

## Notes
- Posts without content but with media files will be rejected (at least 1 char required)
- Content max length is 5000 characters
- Files must be less than 10 MB each
- Maximum 5 files per post
- Posts appear in feed for all users in real-time via Socket.io
- Users remain on create post page after successful publish
