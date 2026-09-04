import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X, Heart, MessageCircle, Share2, Bookmark, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  assets, 
  menuItemsData, 
  dummyStoriesData,
  dummyPostsData 
} from '../assets/assets.js';
import { postService } from '../services/postService.js';
import { socketService } from '../services/socketService.js';
import { useApp } from '../context/AppContext';
import LoadingSpinner from '../components/loading';

export default function Feed() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { posts, setPosts, isLoading, setIsLoading, isOnline, addNotification, user } = useApp();
  const [page, setPage] = useState(1);
  const currentUser = user || { full_name: 'Your Profile', username: 'your_username', profile_picture: '' };
  
  // Post engagement state
  const [postEngagement, setPostEngagement] = useState({});
  const [commentInput, setCommentInput] = useState({});
  const [commentReplyInput, setCommentReplyInput] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [loadingPostId, setLoadingPostId] = useState(null);
  const [copiedShareLinkFor, setCopiedShareLinkFor] = useState(null);
  const [stories, setStories] = useState(dummyStoriesData || []);
  const [activeReel, setActiveReel] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isReelPlaying, setIsReelPlaying] = useState(true);
  const [reelProgress, setReelProgress] = useState(0);
  const reelTimerRef = useRef(null);
  const mediaElementRef = useRef(null);
  
  const clearReelTimer = () => {
    if (reelTimerRef.current) {
      clearInterval(reelTimerRef.current);
      reelTimerRef.current = null;
    }
    setReelProgress(0);
  };

  const startReelTimer = (durationMs = 5000) => {
    clearReelTimer();
    const start = Date.now();
    reelTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setReelProgress(pct);
      if (pct >= 100) {
        clearReelTimer();
        nextReelMedia();
      }
    }, 200);
  };

  const nextReelMedia = () => {
    const mediaList = getPostMedia(activeReel);
    if (!mediaList || mediaList.length === 0) return;
    setActiveReelIndex((prev) => {
      const next = (prev + 1) % mediaList.length;
      setReelProgress(0);
      if (isReelPlaying) {
        const el = mediaElementRef.current;
        if (el && el.duration) startReelTimer(el.duration * 1000);
      }
      return next;
    });
  };

  const previousReelMedia = () => {
    const mediaList = getPostMedia(activeReel);
    if (!mediaList || mediaList.length === 0) return;
    setActiveReelIndex((prev) => {
      const prevIndex = (prev - 1 + mediaList.length) % mediaList.length;
      setReelProgress(0);
      return prevIndex;
    });
  };

  // Pause/Play effects
  useEffect(() => {
    if (!activeReel) return;
    if (!isReelPlaying) {
      if (mediaElementRef.current && mediaElementRef.current.pause) mediaElementRef.current.pause();
      clearReelTimer();
    } else {
      const mediaList = getPostMedia(activeReel);
      const current = mediaList[activeReelIndex];
      if (current?.type === 'image') {
        // image default duration
        startReelTimer(4000);
      } else if (mediaElementRef.current && mediaElementRef.current.duration) {
        startReelTimer(mediaElementRef.current.duration * 1000);
      } else {
        startReelTimer(5000);
      }
      if (mediaElementRef.current && mediaElementRef.current.play) mediaElementRef.current.play().catch(() => {});
    }
    return () => clearReelTimer();
  }, [isReelPlaying, activeReelIndex, activeReel]);
  const [isReelModalOpen, setIsReelModalOpen] = useState(false);
  const [reelContent, setReelContent] = useState('');
  const [reelFiles, setReelFiles] = useState([]);
  const [reelPreview, setReelPreview] = useState([]);
  const [reelError, setReelError] = useState('');
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  const [reelSuccessMessage, setReelSuccessMessage] = useState('');

  const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'https://dev-threads-2.onrender.com';

  const resolveMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return '';
    const url = String(mediaUrl).trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return `https:${url}`;
    if (url.startsWith('/')) return `${BACKEND_BASE_URL}${url}`;
    return `${BACKEND_BASE_URL}/${url}`;
  };

  const getFileNameFromUrl = (url) => {
    if (!url) return 'Document';
    try {
      return String(url).split('/').pop().split('?')[0];
    } catch {
      return 'Document';
    }
  };

  const getPostMedia = (post) => {
    if (!post) return [];

    if (Array.isArray(post.media) && post.media.length > 0) {
      return post.media
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'string') return { url: item, type: 'image' };

          const url = item.url || item.media_url || item.path || item.file;
          const type = item.type || item.media_type || (item.mimetype?.startsWith('video') ? 'video' : item.mimetype?.startsWith('application') ? 'document' : item.mimetype?.startsWith('audio') ? 'audio' : 'image');
          return { ...item, url, type };
        })
        .filter(Boolean);
    }

    if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
      return post.image_urls.map((url) => ({ url, type: 'image' }));
    }

    if (post.media_url) {
      return [{ url: post.media_url, type: post.media_type || 'image' }];
    }

    return [];
  };

  const handleReelFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (reelFiles.length + files.length > 5) {
      setReelError('Maximum 5 files per reel');
      return;
    }

    const validFiles = [];
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setReelError(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReelPreview((prev) => [...prev, {
          name: file.name,
          type: file.type,
          preview: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (validFiles.length > 0) {
      setReelFiles((prev) => [...prev, ...validFiles]);
      setReelError('');
    }
  };

  const removeReelFile = (index) => {
    setReelFiles((prev) => prev.filter((_, idx) => idx !== index));
    setReelPreview((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateReel = async () => {
    if (!reelContent.trim() && reelFiles.length === 0) {
      setReelError('Reel must include text or media');
      return;
    }

    setIsCreatingReel(true);
    setReelError('');
    setReelSuccessMessage('');

    try {
      const response = await postService.createPost(reelContent.trim(), reelFiles);
      const createdPost = response.post || response;
      if (createdPost) {
        setPosts((prev) => [createdPost, ...prev]);
        initializeEngagement([createdPost]);
        setReelSuccessMessage('Reel posted successfully and will remain visible in the feed.');
        setReelContent('');
        setReelFiles([]);
        setReelPreview([]);
        addNotification('Reel created successfully');
      }
    } catch (error) {
      console.error('Create reel error:', error);
      setReelError(error?.message || 'Failed to create reel. Please try again.');
    } finally {
      setIsCreatingReel(false);
    }
  };

  // Fetch feed and stories on component mount
  const isStoryActive = (story) => {
    if (!story) return false;
    const now = Date.now();
    if (story.expiresAt) return new Date(story.expiresAt).getTime() > now;
    if (story.createdAt) return (new Date(story.createdAt).getTime() + 24 * 60 * 60 * 1000) > now;
    return true;
  };

  useEffect(() => {
    fetchFeed();
    setStories((dummyStoriesData || []).filter(isStoryActive));
  }, []);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const data = await postService.getFeed(page, 10);
      const feedPosts = data.posts || data.data || dummyPostsData;
      setPosts(feedPosts);
      initializeEngagement(feedPosts);
    } catch (error) {
      console.error('API fetch failed, using dummy data:', error);
      setPosts(dummyPostsData);
      initializeEngagement(dummyPostsData);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeOwnerId = (value) => {
    if (!value && value !== 0) return null;
    if (typeof value === 'string') return value;
    if (value?._id) return value._id.toString();
    if (value?.userId) return normalizeOwnerId(value.userId);
    if (value?.toString) return value.toString();
    return null;
  };

  // Initialize engagement state for posts
  const initializeEngagement = (postsArray) => {
    const engagement = {};
    const currentUserId = localStorage.getItem('clerkId');

    postsArray.forEach(post => {
      const hasLiked = post.likes?.some((like) => normalizeOwnerId(like) === currentUserId) || false;
      const hasShared = post.shares?.some((share) => normalizeOwnerId(share) === currentUserId) || false;
      const hasBookmarked = post.bookmarks?.some((bookmark) => normalizeOwnerId(bookmark) === currentUserId) || false;

      engagement[post._id] = {
        likeCount: post.likeCount || post.likes?.length || 0,
        commentCount: post.commentCount || post.comments?.length || 0,
        shareCount: post.shareCount || post.shares?.length || 0,
        bookmarkCount: post.bookmarkCount || post.bookmarks?.length || 0,
        isLiked: hasLiked,
        isShared: hasShared,
        isBookmarked: hasBookmarked,
      };
    });
    setPostEngagement(engagement);
  };

  const handleToggleLike = async (postId) => {
    setLoadingPostId(postId);
    const current = postEngagement[postId] || {};
    const shouldLike = !current.isLiked;
    // Clone previous engagement and posts so we can safely revert on error
    const previousEngagement = current ? JSON.parse(JSON.stringify(current)) : null;
    const previousPosts = Array.isArray(posts) ? JSON.parse(JSON.stringify(posts)) : posts;
    const currentUserId = localStorage.getItem('clerkId');

    setPostEngagement((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isLiked: shouldLike,
        likeCount: Math.max((prev[postId]?.likeCount || 0) + (shouldLike ? 1 : -1), 0)
      }
    }));

    setPosts((prev) => prev.map((p) => {
      if (p._id !== postId) return p;
      const currentLikeCount = p.likeCount || p.likes?.length || 0;
      return {
        ...p,
        likeCount: Math.max(currentLikeCount + (shouldLike ? 1 : -1), 0),
        likes: shouldLike
          ? [...(p.likes || []), currentUserId]
          : (p.likes || []).filter((like) => normalizeOwnerId(like) !== currentUserId)
      };
    }));

    socketService.socketEmit('toggle_like', {
      postId,
      userId: currentUserId,
      action: shouldLike ? 'like' : 'unlike'
    });

    try {
      const result = shouldLike
        ? await postService.likePost(postId)
        : await postService.unlikePost(postId);

      if (result.post) {
        setPosts((prev) => prev.map((p) => p._id === postId ? result.post : p));
        setPostEngagement((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isLiked: shouldLike,
            likeCount: result.post.likeCount || result.post.likes?.length || prev[postId].likeCount
          }
        }));
      }
    } catch (error) {
      console.error('Toggle like error:', error);
      addNotification(`Failed to ${shouldLike ? 'like' : 'unlike'} post`);
      // Revert to cloned previous state
      setPosts(previousPosts);
      if (previousEngagement) {
        setPostEngagement((prev) => ({
          ...prev,
          [postId]: previousEngagement
        }));
      }
    } finally {
      setLoadingPostId(null);
    }
  };

  // Handle Comment
  const handleComment = async (postId) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    setLoadingPostId(postId);
    const previousPosts = posts;
    const previousEngagement = postEngagement[postId];

    setPostEngagement((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        commentCount: (prev[postId]?.commentCount || 0) + 1
      }
    }));

    setPosts((prev) => prev.map((p) => p._id === postId ? {
      ...p,
      comments: [...(p.comments || []), { text, userId: { _id: localStorage.getItem('clerkId') } }],
      commentCount: (p.commentCount || p.comments?.length || 0) + 1
    } : p));

    socketService.socketEmit('toggle_comment', {
      postId,
      userId: localStorage.getItem('clerkId'),
      text
    });

    try {
      const result = await postService.addComment(postId, text);
      if (result.post) {
        setPosts((prev) => prev.map((p) => p._id === postId ? result.post : p));
        setPostEngagement((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            commentCount: result.post.commentCount || result.post.comments?.length || prev[postId].commentCount
          }
        }));
        setCommentInput((prev) => ({
          ...prev,
          [postId]: ''
        }));
        addNotification('Comment added!');
      }
    } catch (error) {
      console.error('Comment error:', error);
      addNotification('Failed to add comment');
      setPosts(previousPosts);
      setPostEngagement(previousEngagement ? { ...postEngagement, [postId]: previousEngagement } : postEngagement);
    } finally {
      setLoadingPostId(null);
    }
  };

  // Handle Share
  const toggleCommentsVisibility = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleReplyToComment = async (postId, commentId) => {
    const text = commentReplyInput[commentId];
    if (!text || !text.trim()) return;

    setLoadingPostId(postId);
    try {
      const response = await postService.replyToComment(postId, commentId, text);
      if (response.post) {
        setPosts((prev) => prev.map((p) => p._id === postId ? response.post : p));
        setCommentReplyInput((prev) => ({
          ...prev,
          [commentId]: ''
        }));
        addNotification('Reply posted successfully');
      }
    } catch (error) {
      console.error('Reply error:', error);
      addNotification('Failed to post reply');
    } finally {
      setLoadingPostId(null);
    }
  };

  const handleReactToComment = async (postId, commentId, emoji) => {
    setLoadingPostId(commentId);
    // Optimistic update: toggle reaction locally then call API
    const previousPosts = Array.isArray(posts) ? JSON.parse(JSON.stringify(posts)) : posts;
    const currentUserId = localStorage.getItem('clerkId');

    setPosts((prev) => prev.map((p) => {
      if (p._id !== postId) return p;
      const updatedComments = (p.comments || []).map((c) => {
        if (String(c._id) !== String(commentId)) return c;
        const reactions = c.reactions || [];
        const alreadyReactedIndex = reactions.findIndex(r => String(r.userId?._id || r.userId) === String(currentUserId) && r.emoji === emoji);
        let newReactions;
        if (alreadyReactedIndex >= 0) {
          // remove reaction
          newReactions = reactions.filter((_, i) => i !== alreadyReactedIndex);
        } else {
          // add reaction
          newReactions = [...reactions, { emoji, userId: { _id: currentUserId } }];
        }
        return { ...c, reactions: newReactions };
      });
      return { ...p, comments: updatedComments };
    }));

    try {
      const response = await postService.reactToComment(postId, commentId, emoji);
      if (response.post) {
        setPosts((prev) => prev.map((p) => p._id === postId ? response.post : p));
        addNotification('Comment reaction updated');
      }
    } catch (error) {
      console.error('React to comment error:', error);
      addNotification('Failed to react to comment');
      // revert
      setPosts(previousPosts);
    } finally {
      setLoadingPostId(null);
    }
  };

  const handleShare = async (postId) => {
    setLoadingPostId(postId);
    const previousPosts = posts;
    const previousEngagement = postEngagement[postId];

    setPostEngagement((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        shareCount: (prev[postId]?.shareCount || 0) + 1,
        isShared: true
      }
    }));

    setPosts((prev) => prev.map((p) => p._id === postId ? {
      ...p,
      shareCount: (p.shareCount || p.shares?.length || 0) + 1,
      shares: [...(p.shares || []), { userId: localStorage.getItem('clerkId') }]
    } : p));

    socketService.socketEmit('toggle_share', {
      postId,
      userId: localStorage.getItem('clerkId'),
      action: 'share'
    });

    try {
      const result = await postService.sharePost(postId);
      if (result.post) {
        setPosts((prev) => prev.map((p) => p._id === postId ? result.post : p));
        setPostEngagement((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            shareCount: result.post.shareCount || result.post.shares?.length || prev[postId].shareCount,
            isShared: true
          }
        }));

        const shareUrl = `${window.location.origin}/post/${postId}`;
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(shareUrl);
          setCopiedShareLinkFor(postId);
          setTimeout(() => setCopiedShareLinkFor(null), 3000);
          addNotification('Share link copied to clipboard!');
        } else {
          addNotification(`Share link ready: ${shareUrl}`);
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      addNotification('Failed to share post');
      setPosts(previousPosts);
      setPostEngagement(previousEngagement ? { ...postEngagement, [postId]: previousEngagement } : postEngagement);
    } finally {
      setLoadingPostId(null);
    }
  };

  // Handle Bookmark
  const handleBookmark = async (postId) => {
    setLoadingPostId(postId);
    const isBookmarked = postEngagement[postId]?.isBookmarked;
    const previousPosts = posts;
    const previousEngagement = postEngagement[postId];

    setPostEngagement((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isBookmarked: !isBookmarked,
        bookmarkCount: isBookmarked
          ? Math.max((prev[postId]?.bookmarkCount || 1) - 1, 0)
          : (prev[postId]?.bookmarkCount || 0) + 1
      }
    }));

    setPosts((prev) => prev.map((p) => p._id === postId ? {
      ...p,
      bookmarkCount: isBookmarked
        ? Math.max((p.bookmarkCount || p.bookmarks?.length || 1) - 1, 0)
        : (p.bookmarkCount || p.bookmarks?.length || 0) + 1,
      bookmarks: isBookmarked
        ? (p.bookmarks || []).filter((bookmark) => normalizeOwnerId(bookmark) !== localStorage.getItem('clerkId'))
        : [...(p.bookmarks || []), localStorage.getItem('clerkId')]
    } : p));

    socketService.socketEmit('toggle_bookmark', {
      postId,
      userId: localStorage.getItem('clerkId'),
      action: isBookmarked ? 'unbookmark' : 'bookmark'
    });

    try {
      const result = isBookmarked
        ? await postService.removeBookmark(postId)
        : await postService.bookmarkPost(postId);

      if (result.post) {
        setPosts((prev) => prev.map((p) => p._id === postId ? result.post : p));
        setPostEngagement((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isBookmarked: !isBookmarked,
            bookmarkCount: result.post.bookmarkCount || result.post.bookmarks?.length || prev[postId].bookmarkCount
          }
        }));
        if (!isBookmarked) addNotification('Post bookmarked!');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      addNotification('Failed to bookmark post');
      setPosts(previousPosts);
      setPostEngagement(previousEngagement ? { ...postEngagement, [postId]: previousEngagement } : postEngagement);
    } finally {
      setLoadingPostId(null);
    }
  };

  // Navigate to user profile
  const goToUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Listen for real-time post creation, deletion, and engagement updates
  useEffect(() => {
    const normalizeOwnerId = (value) => {
      if (!value && value !== 0) return null;
      if (typeof value === 'string') return value;
      if (value?._id) return value._id.toString();
      if (value?.userId) return normalizeOwnerId(value.userId);
      if (value?.toString) return value.toString();
      return null;
    };

    const updateEngagementState = (updatedPost) => {
      if (!updatedPost?._id) return;
      const currentUserId = localStorage.getItem('clerkId');
      setPostEngagement((prev) => ({
        ...prev,
        [updatedPost._id]: {
          ...prev[updatedPost._id],
          likeCount: updatedPost.likeCount || updatedPost.likes?.length || prev[updatedPost._id]?.likeCount || 0,
          commentCount: updatedPost.commentCount || updatedPost.comments?.length || prev[updatedPost._id]?.commentCount || 0,
          shareCount: updatedPost.shareCount || updatedPost.shares?.length || prev[updatedPost._id]?.shareCount || 0,
          bookmarkCount: updatedPost.bookmarkCount || updatedPost.bookmarks?.length || prev[updatedPost._id]?.bookmarkCount || 0,
          isLiked: updatedPost.likes?.some(like => normalizeOwnerId(like) === currentUserId) || prev[updatedPost._id]?.isLiked || false,
          isShared: updatedPost.shares?.some(share => normalizeOwnerId(share) === currentUserId) || prev[updatedPost._id]?.isShared || false,
          isBookmarked: updatedPost.bookmarks?.some(bookmark => normalizeOwnerId(bookmark) === currentUserId) || prev[updatedPost._id]?.isBookmarked || false,
        }
      }));
    };

    const handlePostCreated = (newPost) => {
      console.log('📡 New post received from socket:', newPost);
      const postData = newPost.post || newPost;

      // Upsert the post at the top of the feed while ensuring uniqueness by _id
      setPosts((prev) => {
        const exists = prev.some((p) => p._id === postData._id);
        if (exists) {
          // Replace existing item so updates don't create duplicates
          return prev.map((p) => (p._id === postData._id ? postData : p));
        }
        // Prepend and remove any accidental duplicates
        return [postData, ...prev.filter((p) => p._id !== postData._id)];
      });

      initializeEngagement([postData]);

      if (postData.media && postData.media.length > 0) {
        const newStory = {
          id: postData._id,
          image: resolveMediaUrl(postData.media[0]?.url || postData.media[0]?.media_url || getAvatar(postData.userId || postData.user)),
          user: postData.userId || postData.user,
          title: `${postData.userId?.full_name || postData.user?.full_name || 'Someone'} posted a reel`,
          createdAt: postData.createdAt
        };

        // Prepend story and keep unique by id; filter expired
        setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id && isStoryActive(s))].slice(0, 8));
      }

      addNotification(`${postData.userId?.full_name || postData.user?.full_name || 'Someone'} posted something new!`);
    };

    const handlePostDeleted = (data) => {
      if (!data?.postId) return;
      setPosts((prev) => prev.filter((post) => post._id !== data.postId));
      setPostEngagement((prev) => {
        const next = { ...prev };
        delete next[data.postId];
        return next;
      });
      addNotification('A post was removed from the feed');
    };

    const handleEngagementUpdate = (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      setPosts((prev) => prev.map((post) => post._id === updatedPost._id ? updatedPost : post));
      updateEngagementState(updatedPost);
    };

    const unsubscribeCreated = socketService.on('postCreated', handlePostCreated);
    const unsubscribeDeleted = socketService.on('postDeleted', handlePostDeleted);
    const unsubscribeLiked = socketService.on('postLiked', handleEngagementUpdate);
    const unsubscribeUnliked = socketService.on('postUnliked', handleEngagementUpdate);
    const unsubscribeCommented = socketService.on('postCommented', handleEngagementUpdate);
    const unsubscribeShared = socketService.on('postShared', handleEngagementUpdate);
    const unsubscribeBookmarked = socketService.on('postBookmarked', handleEngagementUpdate);
    const unsubscribeBookmarkRemoved = socketService.on('postBookmarkRemoved', handleEngagementUpdate);
    const unsubscribeGeneric = socketService.on('postEngagementUpdate', handleEngagementUpdate);
    const unsubscribeStoryCreated = socketService.on('storyCreated', (storyData) => {
      const storyPayload = storyData.story || storyData;
      const storyObj = {
        id: storyPayload._id,
        image: storyPayload.media_url || storyPayload.background_color || getAvatar(storyPayload.userId),
        user: storyPayload.userId,
        title: `${storyPayload.userId?.full_name || 'Someone'} added a reel`,
        createdAt: storyPayload.createdAt,
        expiresAt: storyPayload.expiresAt
      };

      if (!isStoryActive(storyObj)) return;

      setStories((prev) => [storyObj, ...prev.filter((s) => s.id !== storyObj.id && isStoryActive(s))].slice(0, 8));
    });

    return () => {
      unsubscribeCreated && unsubscribeCreated();
      unsubscribeDeleted && unsubscribeDeleted();
      unsubscribeLiked && unsubscribeLiked();
      unsubscribeUnliked && unsubscribeUnliked();
      unsubscribeCommented && unsubscribeCommented();
      unsubscribeShared && unsubscribeShared();
      unsubscribeBookmarked && unsubscribeBookmarked();
      unsubscribeBookmarkRemoved && unsubscribeBookmarkRemoved();
      unsubscribeGeneric && unsubscribeGeneric();
      unsubscribeStoryCreated && unsubscribeStoryCreated();
    };
  }, [addNotification]);

  // Fallback function to extract profile pictures
  const getAvatar = (user) => {
    if (user?.profile_picture) return user.profile_picture;
    if (user?.imageUrl) return user.imageUrl;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200'; 
  };

  const openReel = (post) => {
    if (!post) return;
    setActiveReel(post);
  };

  const openReelFromStory = (story) => {
    if (!story || !story.id) return;
    const post = posts.find((item) => item._id === story.id || item._id === story._id);
    if (post) {
      openReel(post);
    } else {
      setActiveReel({
        ...story,
        content: story.title || story.content || '',
        media: story.media ? story.media : story.image ? [{ url: story.image, type: 'image' }] : []
      });
    }
  };

  const closeReel = () => setActiveReel(null);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      {/* MOBILE NAVIGATION DRAWER */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 h-full transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={assets.logo} alt="Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold text-[#5c33f6]">Group</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              const isFeedActive = item.label === 'Feed';
              
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isFeedActive
                      ? 'bg-[#eef0ff] text-[#5c33f6]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isFeedActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center space-x-3 px-3 py-2">
            <img 
              src={getAvatar(currentUser)} 
              alt="User" 
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-xs font-bold text-slate-800">{currentUser?.full_name || 'User'}</p>
              <p className="text-[10px] text-slate-400">@{currentUser?.username || 'user'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6 md:py-8">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <div className="flex items-center space-x-2">
            <img src={assets.logo} alt="Logo" className="h-6 w-auto" />
            <span className="text-lg font-bold text-[#5c33f6]">Feed</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Feed</h1>
            <p className="text-sm text-slate-500 mt-1">Create reels, watch stories, and see new posts in real time.</p>
          </div>
          <button
            onClick={() => setIsReelModalOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-[#5c33f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2ecc] transition-colors"
          >
            Create Reel
          </button>
        </div>

        {/* Stories Section */}
        {stories && stories.length > 0 && (
          <div className="mb-8 flex gap-3 overflow-x-auto pb-4">
            {stories.map((story) => (
              <button
                key={story.id || story._id}
                type="button"
                onClick={() => openReelFromStory(story)}
                className="flex-shrink-0 w-16 h-24 rounded-xl bg-gradient-to-b from-slate-200 to-slate-300 cursor-pointer hover:opacity-75 transition-opacity border-2 border-slate-300 overflow-hidden"
              >
                <img src={story.image} alt={story.title || 'Story'} className="w-full h-full object-cover rounded-xl" />
              </button>
            ))}
          </div>
        )}

        {/* Active Reel Viewer */}
        {activeReel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 py-6">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 overflow-y-auto max-h-[90vh]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{activeReel.userId?.full_name || activeReel.user?.full_name || activeReel.title || 'Reel'}</h2>
                  <p className="text-sm text-slate-500">{activeReel.title || activeReel.content || 'Watch this reel'}</p>
                </div>
                <button
                  onClick={closeReel}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {getPostMedia(activeReel).length > 0 ? (
                (() => {
                  const mediaList = getPostMedia(activeReel);
                  const current = mediaList[activeReelIndex] || mediaList[0];
                  const mediaUrl = current ? resolveMediaUrl(current.url) : null;
                  const mediaType = current?.type || 'image';

                  return (
                    <div className="grid gap-4">
                      <div className="relative">
                        {mediaType === 'video' && mediaUrl && (
                          <video
                            ref={mediaElementRef}
                            key={activeReelIndex}
                            className="w-full rounded-3xl bg-slate-900"
                            style={{ maxHeight: '450px' }}
                            src={mediaUrl}
                            onLoadedMetadata={() => {
                              const vid = mediaElementRef.current;
                              if (!vid) return;
                              const durationMs = (vid.duration || 5) * 1000;
                              if (isReelPlaying) startReelTimer(durationMs);
                            }}
                            onPlay={() => setIsReelPlaying(true)}
                            onPause={() => setIsReelPlaying(false)}
                            playsInline
                          />
                        )}

                        {mediaType === 'image' && mediaUrl && (
                          <img key={activeReelIndex} src={mediaUrl} alt={current?.type} className="w-full rounded-3xl object-cover" />
                        )}

                        {mediaType === 'audio' && mediaUrl && (
                          <audio key={activeReelIndex} controls className="w-full rounded-3xl bg-slate-900 p-3" src={mediaUrl} />
                        )}

                        {(mediaType === 'document' || (mediaUrl && mediaUrl.toLowerCase().endsWith('.pdf'))) && mediaUrl && (
                          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">{current.name || getFileNameFromUrl(mediaUrl)}</p>
                                <p className="text-sm text-slate-500">Document preview</p>
                              </div>
                              <a href={mediaUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#5c33f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2ecc] transition-colors">
                                Open
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Controls */}
                        <div className="absolute left-4 top-4 flex items-center gap-2">
                          <button onClick={() => { setIsReelPlaying((s) => !s); if (mediaElementRef.current && mediaElementRef.current.pause) {
                              if (isReelPlaying) mediaElementRef.current.pause(); else mediaElementRef.current.play();
                            } }} className="rounded-full bg-white/90 p-2">
                            {isReelPlaying ? 'Pause' : 'Play'}
                          </button>
                          <button onClick={() => previousReelMedia()} className="rounded-full bg-white/90 p-2">Prev</button>
                          <button onClick={() => nextReelMedia()} className="rounded-full bg-white/90 p-2">Next</button>
                        </div>

                        {/* Progress */}
                        <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/30 rounded-b-3xl overflow-hidden">
                          <div style={{ width: `${reelProgress}%` }} className="h-1 bg-[#5c33f6] transition-[width] duration-200" />
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No media available for this reel.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reel Modal */}
        {isReelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create Reel</h2>
                  <p className="text-sm text-slate-500">Post a short reel with media and text. It stays in feed until you close it.</p>
                </div>
                <button
                  onClick={() => setIsReelModalOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reel caption</label>
                  <textarea
                    value={reelContent}
                    onChange={(e) => setReelContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 focus:border-[#5c33f6] focus:outline-none"
                    placeholder="Write something about your reel..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Add media</label>
                  <input
                    type="file"
                    accept="image/*,video/*,application/pdf,audio/*"
                    multiple
                    onChange={handleReelFileSelect}
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 file:rounded-full file:border-0 file:bg-[#5c33f6] file:px-4 file:py-2 file:text-sm file:text-white"
                  />
                  {reelError && <p className="mt-2 text-sm text-rose-500">{reelError}</p>}
                </div>

                {reelPreview.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {reelPreview.map((file, index) => (
                      <div key={index} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {file.type.startsWith('video/') ? (
                          <video src={file.preview} controls className="h-36 w-full object-cover" />
                        ) : file.type.startsWith('audio/') ? (
                          <div className="flex h-36 w-full flex-col items-center justify-center gap-2 p-4 text-sm text-slate-700">
                            <p className="font-semibold">{file.name}</p>
                            <audio controls src={file.preview} className="w-full" />
                          </div>
                        ) : (
                          <img src={file.preview} alt={file.name} className="h-36 w-full object-cover" />
                        )}
                        <button
                          onClick={() => removeReelFile(index)}
                          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm hover:bg-white"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {reelSuccessMessage && (
                  <div className="rounded-2xl bg-emerald-100 p-4 text-sm text-emerald-800">{reelSuccessMessage}</div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handleCreateReel}
                    disabled={isCreatingReel}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#5c33f6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4a2ecc] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingReel ? 'Posting...' : 'Post Reel'}
                  </button>
                  <button
                    onClick={() => setIsReelModalOpen(false)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CORE TIMELINE POST FEED */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Recent Posts</h2>
          
          {posts && posts.length > 0 ? posts.map((post) => {
            const engagement = postEngagement[post._id] || {};
            
            return (
              <div 
                key={post._id}
                className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4"
              >
                {/* Card Header - Post Metadata */}
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => goToUserProfile(post.userId?._id || post.userId)}
                  >
                    <img 
                      src={getAvatar(post.userId || post.user)} 
                      alt={post.userId?.full_name || post.user?.full_name} 
                      className="w-10 h-10 rounded-full bg-slate-100 object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[140px] sm:max-w-none">
                          {post.userId?.full_name || post.user?.full_name || 'User'}
                        </h3>
                        {(post.userId?.is_verified || post.user?.is_verified) && (
                          <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded-full font-bold">✓</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        @{post.userId?.username || post.user?.username || 'user'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words overflow-hidden whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Post Media */}
                {getPostMedia(post).length > 0 && (
                  <button
                    type="button"
                    onClick={() => openReel(post)}
                    className="rounded-xl overflow-hidden max-h-96 sm:max-h-[420px] w-full border border-slate-50 bg-slate-50 cursor-pointer"
                  >
                    {getPostMedia(post).map((media, idx) => {
                      const mediaUrl = resolveMediaUrl(media?.url || media);
                      const mediaType = media?.type
                        || (media?.mimetype?.startsWith('video') ? 'video'
                          : media?.mimetype?.startsWith('application') ? 'document'
                          : 'image');

                      if (!mediaUrl) return null;

                      if (mediaType === 'video' || (media?.mimetype?.startsWith && media?.mimetype?.startsWith('video'))) {
                        return (
                          <video 
                            key={idx}
                            controls
                            className="w-full h-full object-cover"
                            style={{ maxHeight: '420px' }}
                          >
                            <source src={mediaUrl} type={media?.mimetype || 'video/mp4'} />
                            Your browser does not support the video tag.
                          </video>
                        );
                      }

                      if (mediaType === 'document' || mediaUrl.toLowerCase().endsWith('.pdf')) {
                        return (
                          <div key={idx} className="p-4 bg-slate-100 border-t border-slate-200">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{media?.name || getFileNameFromUrl(mediaUrl)}</p>
                                <p className="text-xs text-slate-500">Document - click to open or download.</p>
                              </div>
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-[#5c33f6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4a2ecc] transition-colors"
                              >
                                Open Document
                              </a>
                            </div>
                          </div>
                        );
                      }

                      if (mediaType === 'audio' || (media?.mimetype?.startsWith && media?.mimetype?.startsWith('audio'))) {
                        return (
                          <audio key={idx} controls className="w-full bg-slate-100 p-4">
                            <source src={mediaUrl} type={media?.mimetype || 'audio/mpeg'} />
                            Your browser does not support the audio element.
                          </audio>
                        );
                      }

                      return (
                        <img 
                          key={idx}
                          src={mediaUrl} 
                          alt={`Post media ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            try {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/400x300?text=Media+Unavailable';
                            } catch (err) {
                              console.error('Failed to set fallback image', err);
                            }
                          }}
                        />
                      );
                    })}
                  </button>
                )}

                {/* Engagement Stats */}
                <div className="border-t border-slate-50 pt-3 text-xs text-slate-500 flex gap-4">
                  {engagement.likeCount > 0 && <span>{engagement.likeCount} likes</span>}
                  {engagement.commentCount > 0 && <span>{engagement.commentCount} comments</span>}
                  {engagement.shareCount > 0 && <span>{engagement.shareCount} shares</span>}
                  {engagement.bookmarkCount > 0 && <span>{engagement.bookmarkCount} bookmarks</span>}
                </div>

                {/* Engagement Buttons */}
                <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-slate-400">
                  <div className="flex items-center space-x-6">
                    {/* Like Button */}
                    <button 
                      onClick={() => handleToggleLike(post._id)}
                      disabled={loadingPostId === post._id}
                      className={`flex items-center space-x-1.5 transition-colors group text-xs font-semibold ${
                        engagement.isLiked 
                          ? 'text-rose-500 hover:text-rose-600' 
                          : 'text-slate-400 hover:text-rose-500'
                      } disabled:opacity-50`}
                    >
                      <Heart 
                        className={`w-4 h-4 group-hover:scale-110 transition-transform ${engagement.isLiked ? 'fill-current' : ''}`} 
                      />
                      <span>{engagement.likeCount || 0}</span>
                    </button>

                    {/* Comment Button */}
                    <div className="flex items-center space-x-1.5 text-slate-400 hover:text-[#5c33f6] group text-xs font-semibold">
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>{engagement.commentCount || 0}</span>
                    </div>
                  </div>

                  {/* Share & Bookmark */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <button 
                        onClick={() => handleShare(post._id)}
                        disabled={loadingPostId === post._id}
                        className="hover:text-slate-700 transition-colors disabled:opacity-50"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      {copiedShareLinkFor === post._id && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg">
                          Link copied!
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => handleBookmark(post._id)}
                      disabled={loadingPostId === post._id}
                      className={`hover:text-slate-700 transition-colors disabled:opacity-50 ${
                        engagement.isBookmarked ? 'text-slate-700' : ''
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark 
                        className={`w-4 h-4 ${engagement.isBookmarked ? 'fill-current' : ''}`} 
                      />
                    </button>
                  </div>
                </div>

                {/* Comment Input Section */}
                <div className="border-t border-slate-50 pt-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput[post._id] || ''}
                      onChange={(e) => setCommentInput(prev => ({
                        ...prev,
                        [post._id]: e.target.value
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleComment(post._id);
                        }
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5c33f6] transition-colors"
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      disabled={loadingPostId === post._id || !commentInput[post._id]?.trim()}
                      className="p-2 text-[#5c33f6] hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}</span>
                        <button
                          onClick={() => toggleCommentsVisibility(post._id)}
                          className="text-[#5c33f6] font-semibold hover:underline"
                        >
                          {expandedComments[post._id] ? 'Hide' : 'View'} comments
                        </button>
                      </div>

                      {expandedComments[post._id] ? (
                        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          {post.comments.map((comment) => {
                            const commentReactions = comment.reactions || [];
                            return (
                              <div key={comment._id || comment.createdAt} className="space-y-2">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                      <span className="font-semibold text-slate-800">{comment.userId?.full_name || 'User'}</span>
                                      <span>{new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <p className="text-sm text-slate-700">{comment.text}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                      {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleReactToComment(post._id, comment._id, emoji)}
                                          disabled={loadingPostId === comment._id}
                                          className="rounded-full px-2 py-1 hover:bg-slate-200 transition-colors"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                      {commentReactions.length > 0 && (
                                        <span className="text-slate-400">{commentReactions.length} reaction{commentReactions.length !== 1 ? 's' : ''}</span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setCommentReplyInput((prev) => ({ ...prev, [comment._id]: prev[comment._id] || '' }))}
                                        className="text-[#5c33f6] hover:underline"
                                      >
                                        Reply
                                      </button>
                                    </div>

                                    {comment.replies && comment.replies.length > 0 && (
                                      <div className="mt-3 rounded-2xl bg-white p-3 border border-slate-100">
                                        {comment.replies.map((reply) => (
                                          <div key={reply._id || reply.createdAt} className="space-y-1 text-[11px] text-slate-600">
                                            <div className="font-semibold text-slate-800">{reply.userId?.full_name || 'User'} replied</div>
                                            <div>{reply.text}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {commentReplyInput[comment._id] !== undefined && (
                                      <div className="mt-3 space-y-2">
                                        <input
                                          type="text"
                                          value={commentReplyInput[comment._id]}
                                          onChange={(e) => setCommentReplyInput((prev) => ({
                                            ...prev,
                                            [comment._id]: e.target.value
                                          }))}
                                          placeholder={`Reply to ${comment.userId?.full_name || 'user'}`}
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:border-[#5c33f6]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleReplyToComment(post._id, comment._id)}
                                          disabled={loadingPostId === post._id || !commentReplyInput[comment._id]?.trim()}
                                          className="rounded-xl bg-[#5c33f6] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#4a2ecc] disabled:opacity-50"
                                        >
                                          Send reply
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                          {post.comments.slice(0, 2).map((comment) => (
                            <div key={comment._id || comment.createdAt} className="text-xs">
                              <p className="font-semibold text-slate-800">{comment.userId?.full_name || 'User'}</p>
                              <p className="text-slate-600">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <p className="text-slate-500">No posts yet. Be the first to post!</p>
            </div>
          )}
        </div>
      </main>

      {/* Status indicator */}
      <div className="fixed bottom-4 right-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm">
        {isOnline ? 'Live' : 'Offline'}
      </div>
    </div>
  );
}