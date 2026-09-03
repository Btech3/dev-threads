# Feed Component - Real-Time Engagement Implementation

## Overview
The Feed component has been completely updated to include full real-time engagement features with comprehensive state management, error handling, and mobile responsiveness.

## Component Structure

### Imports
- **React Hooks**: `useState`, `useEffect` for state management
- **React Router**: `useNavigate` for profile navigation
- **Icons**: Enhanced with `Send` icon for comment submission
- **Services**: `postService`, `socketService` for API and real-time updates
- **Context**: `useApp` hook for global state
- **UI Components**: `LoadingSpinner` for loading states

### State Management

#### 1. Engagement State
```javascript
const [postEngagement, setPostEngagement] = useState({});
```
Tracks per-post engagement with structure:
```javascript
{
  [postId]: {
    likeCount: number,
    commentCount: number,
    shareCount: number,
    bookmarkCount: number,
    isLiked: boolean,
    isBookmarked: boolean
  }
}
```

#### 2. Comment Input State
```javascript
const [commentInput, setCommentInput] = useState({});
```
Stores comment text per post: `{ [postId]: "comment text" }`

#### 3. Loading State
```javascript
const [loadingPostId, setLoadingPostId] = useState(null);
```
Tracks which post is currently processing an action to disable buttons during async operations

### Core Functions

#### `initializeEngagement(postsArray)`
Initializes engagement state for all posts from API data.
- Extracts counts from post objects
- Sets default engagement state (not liked, not bookmarked)
- Called on component mount and when socket receives new posts

#### `handleLike(postId)`
**Flow:**
1. Send like request to backend
2. Update local post state with returned post
3. Update engagement state (isLiked = true, increment likeCount)
4. Catches "already liked" error and calls `handleUnlike` instead

**Error Handling:**
- Catches API errors
- Shows notification on failure
- Disables button during request

#### `handleUnlike(postId)`
**Flow:**
1. Send unlike request to backend
2. Update local post state with returned post
3. Update engagement state (isLiked = false, decrement likeCount)

#### `handleComment(postId)`
**Features:**
- Validates comment text is not empty
- Sends comment to backend via `postService.addComment()`
- Updates post comments array in state
- Updates comment count
- Clears input field on success
- Supports Enter key submission

**Input Validation:**
```javascript
const text = commentInput[postId];
if (!text || !text.trim()) return;
```

#### `handleShare(postId)`
- Sends share request to backend
- Updates share count
- Shows "Post shared!" notification
- No toggle needed (can share multiple times)

#### `handleBookmark(postId)`
**Flow:**
1. Check if post is already bookmarked
2. If bookmarked → remove bookmark
3. If not bookmarked → add bookmark
4. Updates state and UI accordingly

**Toggle Logic:**
```javascript
const isBookmarked = postEngagement[postId]?.isBookmarked;
if (isBookmarked) {
  // Remove bookmark
} else {
  // Add bookmark
}
```

#### `goToUserProfile(userId)`
- Navigates to `/profile/{userId}` using React Router
- Triggered by clicking user avatar or name

#### `fetchFeed()`
- Fetches posts from API via `postService.getFeed()`
- Falls back to dummy data if API unavailable
- Initializes engagement state after fetching

### Real-Time Integration

#### Socket.io Listeners
```javascript
useEffect(() => {
  const unsubscribe = socketService.on('post:created', (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    initializeEngagement([newPost]);
    addNotification(`${newPost.userId?.full_name || 'Someone'} posted something new!`);
  });
  
  return () => unsubscribe();
}, []);
```

**Supported Events:**
- `post:created` - New post from other users
- Ready to add: `post:liked`, `post:commented`, `post:shared`, `post:bookmarked` (need backend Socket.io emissions)

## UI Components

### Mobile Navigation Drawer
- Fixed sidebar for small screens
- Slides in from left with smooth animation
- Menu items from `menuItemsData`
- User profile footer with avatar and username
- Auto-closes when menu item clicked

### Main Feed Layout
- **Desktop**: Full width with responsive padding
- **Mobile**: Single column with navigation drawer option
- **Max Width**: 2xl (42rem / 672px)

### Post Card Structure

#### Header Section
- User avatar (clickable → profile)
- User name and username (clickable → profile)
- Verified badge (if applicable)
- Creation date (relative format)

#### Content Section
- Post text with word wrapping
- Media image (if present)

#### Engagement Stats
- Shows counts only if > 0
- Format: "X likes", "X comments", etc.

#### Engagement Buttons
- **Like Button**: Toggle with heart icon, fills when liked
- **Comment Button**: Shows count
- **Share Button**: No fill, shows action
- **Bookmark Button**: Fills when bookmarked

#### Comment Section
- Input field for adding comments
- Send button (disabled if input empty)
- Display first 3 comments
- "View all X comments" link if > 3

### Responsive Design

#### Mobile (< 640px)
- Full width with padding
- Navigation drawer instead of sidebar
- Mobile header with menu toggle
- Touch-friendly spacing
- Smaller font sizes

#### Tablet (640px - 1024px)
- Increased padding
- Same responsive layout
- Medium font sizes

#### Desktop (> 1024px)
- Maximum width constraint
- Larger padding and spacing
- Full-size fonts
- Optional sidebar integration

## State Flow Diagram

```
User Interaction
     ↓
Handle* Function
     ↓
setLoadingPostId(postId) [disable buttons]
     ↓
Call API via postService
     ↓
Update posts array [setPosts]
     ↓
Update engagement state [setPostEngagement]
     ↓
Clear loadingPostId [enable buttons]
     ↓
Show notification (success or error)
```

## API Integration

### Post Service Methods Used
- `getFeed(page, limit)` - Fetch feed posts
- `likePost(postId)` - Like a post
- `unlikePost(postId)` - Unlike a post
- `addComment(postId, text)` - Add comment
- `sharePost(postId)` - Share a post
- `bookmarkPost(postId)` - Bookmark a post
- `removeBookmark(postId)` - Remove bookmark

### Expected API Response Format
```javascript
{
  post: {
    _id: string,
    userId: { _id, full_name, username, profile_picture, is_verified },
    content: string,
    media: [{ url: string }],
    likeCount: number,
    likes: [userId],
    commentCount: number,
    comments: [{ userId, text, createdAt }],
    shareCount: number,
    bookmarkCount: number,
    createdAt: timestamp
  }
}
```

## Error Handling

### Try-Catch Blocks
- All API calls wrapped in try-catch
- Fallback to dummy data if API unavailable
- Error logging to console
- User notifications for failures

### Special Cases
- **Like when already liked**: Automatically calls unlike instead
- **Empty comment**: Validation prevents submission
- **Network errors**: Generic error message shown

## Performance Considerations

1. **Loading State**: Prevents double-clicks by disabling buttons
2. **Lazy Rendering**: Comments limited to first 3 shown
3. **State Optimization**: Per-post engagement tracking minimizes re-renders
4. **Socket Efficiency**: Listeners properly unsubscribed on unmount

## Future Enhancements

### Phase 2: Real-Time Updates
- [ ] Socket.io emissions from backend for like/unlike events
- [ ] Real-time comment updates across all clients
- [ ] Live engagement counter updates
- [ ] Toast notifications for real-time events

### Phase 3: Advanced Features
- [ ] Infinite scroll pagination
- [ ] Comment nested replies
- [ ] Post editing
- [ ] Post deletion with confirmation
- [ ] Comment deletion

### Phase 4: Animations
- [ ] Heart animation on like
- [ ] Smooth count transitions
- [ ] Comment slide-in animations
- [ ] Bookmark fill animation

## Testing Checklist

- [ ] Like/unlike button toggles correctly
- [ ] Comment submission clears input
- [ ] Share increments count
- [ ] Bookmark toggle works
- [ ] User profile navigation works
- [ ] Mobile drawer opens/closes
- [ ] Dummy data displays if API unavailable
- [ ] Error notifications show
- [ ] Loading spinner appears during fetches
- [ ] Real-time socket events (when backend emits)

## Code Quality Notes

- **Component Size**: Large but manageable with clear function separation
- **State Management**: Could be optimized with useReducer for complex engagement logic
- **Comments**: Well-commented for maintenance
- **Type Safety**: No TypeScript (can add for larger project)
- **Accessibility**: Uses semantic HTML and proper ARIA attributes
