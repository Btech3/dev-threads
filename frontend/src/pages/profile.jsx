// import React from 'react'

// const profile = () => {
//   return (
//     <div>
//       <h1>Profile</h1>
//     </div>
//   )
// }

// export default profile


import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { X, MapPin, Calendar } from 'lucide-react';
import { assets, menuItemsData } from '../assets/assets.js';
import { userService } from '../services/userService.js';
import { postService } from '../services/postService.js';
import { socketService } from '../services/socketService.js';
import { useApp } from '../context/AppContext';

export default function Profile() {
  const { profileId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useApp();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', bio: '', location: '', cover_photo: '', profile_picture: '', website: '' });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [coverPhotoPreview, setCoverPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const userId = profileId || user?._id;
  const currentUserId = user?._id || localStorage.getItem('clerkId');

  const normalizeOwnerId = (value) => {
    if (!value && value !== 0) return null;
    if (typeof value === 'string') return value;
    if (value?._id) return value._id.toString();
    if (value?.userId) return normalizeOwnerId(value.userId);
    if (value?.toString) return value.toString();
    return null;
  };

  useEffect(() => {
    if (!profileId && !user?._id) return;
    if (userId) {
      fetchProfileData(userId);
    }
  }, [profileId, user?._id]);

  useEffect(() => {
    const updateUserPosts = (updatedPost) => {
      if (!updatedPost?._id) return;
      setUserPosts((prev) => prev.map((post) => post._id === updatedPost._id ? updatedPost : post));
    };

    const unsubscribePostDeleted = socketService.on('postDeleted', (data) => {
      if (!data?.postId) return;
      setUserPosts((prev) => prev.filter((post) => post._id !== data.postId));
    });

    const unsubscribePostEngagement = socketService.on('postCommented', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribePostLiked = socketService.on('postLiked', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribePostUnliked = socketService.on('postUnliked', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribePostShared = socketService.on('postShared', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribePostBookmarked = socketService.on('postBookmarked', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribePostBookmarkRemoved = socketService.on('postBookmarkRemoved', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribePostCreated = socketService.on('postCreated', (data) => {
      const newPost = data.post || data;
      const authorId = newPost.userId?._id || newPost.userId || newPost.user?._id || newPost.user;
      if (!newPost?._id || !authorId) return;
      if (authorId.toString() === userId?.toString()) {
        setUserPosts((prev) => [newPost, ...prev]);
      }
    });

    const unsubscribeEngagementUpdate = socketService.on('postEngagementUpdate', (data) => {
      const updatedPost = data.updatedPost || data.post;
      if (!updatedPost) return;
      updateUserPosts(updatedPost);
    });

    const unsubscribeUserFollowed = socketService.on('userFollowed', (data) => {
      if (!data) return;
      if (profile?._id === data.targetUserId) {
        setProfile((prev) => prev ? {
          ...prev,
          followers: Array.isArray(prev.followers) ? [...prev.followers, data.followerId] : [data.followerId]
        } : prev);
      }
    });

    const unsubscribeUserUnfollowed = socketService.on('userUnfollowed', (data) => {
      if (!data) return;
      if (profile?._id === data.targetUserId) {
        setProfile((prev) => prev ? {
          ...prev,
          followers: Array.isArray(prev.followers) ? prev.followers.filter((id) => id.toString() !== data.userId?.toString()) : []
        } : prev);
      }
    });

    return () => {
      unsubscribePostDeleted();
      unsubscribePostEngagement();
      unsubscribePostLiked();
      unsubscribePostUnliked();
      unsubscribePostShared();
      unsubscribePostBookmarked();
      unsubscribePostBookmarkRemoved();
      unsubscribePostCreated();
      unsubscribeEngagementUpdate();
      unsubscribeUserFollowed();
      unsubscribeUserUnfollowed();
    };
  }, [profile, userId]);

  const fetchProfileData = async (userIdToFetch) => {
    try {
      setLoading(true);
      const profileData = await userService.getUserById(userIdToFetch);
      const postData = await postService.getUserPosts(userIdToFetch);
      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        cover_photo: profileData.cover_photo || '',
        profile_picture: profileData.profile_picture || '',
        website: profileData.website || ''
      });
      setProfilePicturePreview(profileData.profile_picture || '');
      setCoverPhotoPreview(profileData.cover_photo || '');
      setUserPosts(postData.posts || postData || []);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkedPosts = async () => {
    if (!profile?.bookmarks?.length) {
      setBookmarkedPosts([]);
      return;
    }

    setBookmarksLoading(true);
    try {
      const bookmarkIds = (profile.bookmarks || [])
        .map((bookmark) => normalizeOwnerId(bookmark))
        .filter(Boolean);

      const posts = await Promise.all(bookmarkIds.slice(0, 20).map(async (bookmarkId) => {
        try {
          return await postService.getPost(bookmarkId);
        } catch (err) {
          return null;
        }
      }));

      setBookmarkedPosts(posts.filter(Boolean));
    } catch (err) {
      console.error('Error fetching bookmarked posts:', err);
      setBookmarkedPosts([]);
    } finally {
      setBookmarksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'bookmarks') return;
    fetchBookmarkedPosts();
  }, [activeTab, profile?.bookmarks]);

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
  };

  const resetEditState = () => {
    setProfilePictureFile(null);
    setCoverPhotoFile(null);
    setProfilePicturePreview(profile?.profile_picture || '');
    setCoverPhotoPreview(profile?.cover_photo || '');
    setFormData((prev) => ({
      ...prev,
      profile_picture: profile?.profile_picture || '',
      cover_photo: profile?.cover_photo || ''
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    if (!files || !files[0]) return;

    const file = files[0];
    if (name === 'profile_picture') {
      setProfilePictureFile(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }

    if (name === 'cover_photo_file') {
      setCoverPhotoFile(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!user || user._id !== profile?._id) {
      setError('Cannot edit this profile');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        full_name: formData.full_name,
        bio: formData.bio,
        location: formData.location,
        website: formData.website
      };

      if (coverPhotoFile) {
        const coverUpload = await userService.uploadCoverPhoto(coverPhotoFile);
        payload.cover_photo = coverUpload?.url || formData.cover_photo;
      } else {
        payload.cover_photo = formData.cover_photo;
      }

      if (profilePictureFile) {
        const photoUpload = await userService.uploadProfilePicture(profilePictureFile);
        payload.profile_picture = photoUpload?.url || formData.profile_picture;
      } else {
        payload.profile_picture = formData.profile_picture;
      }

      const updated = await userService.updateProfile(payload);
      setProfile(updated);
      setFormData((prev) => ({
        ...prev,
        profile_picture: updated.profile_picture || prev.profile_picture,
        cover_photo: updated.cover_photo || prev.cover_photo
      }));
      setProfilePictureFile(null);
      setCoverPhotoFile(null);
      setProfilePicturePreview(updated.profile_picture || payload.profile_picture || '');
      setCoverPhotoPreview(updated.cover_photo || payload.cover_photo || '');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = (userData) => {
    if (userData?.profile_picture) return userData.profile_picture;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
  };

  const getCover = (userData) => {
    if (userData?.cover_photo) return userData.cover_photo;
    return 'https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400';
  };

  const resolveMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return '';
    const url = String(mediaUrl).trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return `https:${url}`;
    return url.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'https://dev-threads-2.onrender.com'}${url}` : `${import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || 'https://dev-threads-2.onrender.com'}/${url}`;
  };

  const getPostMedia = (post) => {
    if (!post) return [];

    if (Array.isArray(post.media) && post.media.length > 0) {
      return post.media
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'string') {
            const type = item.endsWith('.mp4') || item.includes('video') ? 'video' : item.toLowerCase().endsWith('.pdf') ? 'document' : 'image';
            return { url: item, type };
          }

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

  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Joined';

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* 1. MOBILE-ONLY TOP HEADER BAR */}
      {/* Hidden on desktop. Displays absolute right-aligned hamburger to control drawer menu */}

      {/* 2. WORKING NAVIGATION DRAWER (Mobile Overlay Panel) */}
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
              const isProfileActive = item.label === 'Profile';
              
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isProfileActive
                      ? 'bg-[#eef0ff] text-[#5c33f6]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isProfileActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(profile)} alt="Profile Avatar" className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{profile?.full_name || 'User'}</h4>
            <span className="text-xs text-slate-400 truncate block">@{profile?.username || 'user'}</span>
          </div>
        </div>
      </div>

      {/* 3. MOBILE MENU BACKGROUND BLUR OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 4. MAIN PROFILE CONTENT CANVAS */}
      <main className="w-full mx-auto max-w-4xl pb-16">
        
        {/* HERO COVER BANNER IMAGE FRAME */}
        <div className="relative h-44 sm:h-60 w-full overflow-hidden bg-slate-200">
          <img 
            src={getCover(profile)} 
            alt="Profile Cover" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* PROFILE META IDENTITY HEADER INFO BLOCK */}
        <div className="px-4 sm:px-8 relative -mt-16 sm:-mt-20 mb-6 flex flex-col space-y-4">
          
          {/* Avatar and Edit Button Alignment Deck */}
          <div className="flex items-end justify-between w-full">
            <div className="relative">
              <img 
                src={getAvatar(profile)} 
                alt={profile?.full_name || 'User'} 
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-slate-100 object-cover shadow-sm"
              />
            </div>
            
            <button
              onClick={() => {
                if (isEditing) {
                  resetEditState();
                }
                handleEditToggle();
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* User Metadata Profile Header Content */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xl font-black text-slate-900"
                />
              ) : (
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {profile?.full_name || 'User'}
                </h1>
              )}
              {profile?.is_verified && (
                <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-slate-400 block">@{profile?.username || 'user'}</span>
          </div>

          <div className="pt-1">
            {isEditing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800"
              />
            ) : (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl whitespace-pre-line break-words pt-1">
                  {profile?.bio || 'No profile bio description supplied yet.'}
                </p>
                {profile?.website && (
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="text-sm text-[#5c33f6] hover:underline">
                    {profile.website}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Meta Indicators Row pills */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-400 pt-1">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              {isEditing ? (
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                />
              ) : (
                <span>{profile?.location || 'Earth'}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{joinDate}</span>
            </div>
          </div>

          {/* Network Follow Counts Row Tracker */}
          <div className="flex flex-wrap items-center gap-x-6 text-xs sm:text-sm pt-2">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-slate-900">{profile?.following?.length || profile?.followingCount || 0}</span>
              <span className="text-slate-400 font-medium">Following</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-slate-900">{profile?.followers?.length || profile?.followerCount || 0}</span>
              <span className="text-slate-400 font-medium">Followers</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-slate-900">{profile?.bookmarks?.length || 0}</span>
              <span className="text-slate-400 font-medium">Bookmarks</span>
            </div>
          </div>

        </div>

        {/* TABS SELECTOR STRIP BAR HEADER */}
        <div className="border-b border-slate-100 px-4 sm:px-8 flex items-center space-x-6 mb-6">
          {['posts', 'media', 'bookmarks'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold transition-colors ${activeTab === tab ? 'border-b-2 border-[#5c33f6] text-[#5c33f6]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab === 'posts' ? 'Posts' : tab === 'media' ? 'Media' : 'Bookmarks'}
            </button>
          ))}
        </div>

        <div className="px-4 sm:px-8 space-y-4">
          {isEditing && user?._id === profile?._id && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Cover Photo</label>
                  <input
                    type="file"
                    name="cover_photo_file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2 w-full text-sm text-slate-700"
                  />
                  <input
                    name="cover_photo"
                    value={formData.cover_photo}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Cover image URL"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Profile Photo</label>
                  <input
                    type="file"
                    name="profile_picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2 w-full text-sm text-slate-700"
                  />
                  <input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Website or social link"
                  />
                </div>
              </div>

              {(profilePicturePreview || coverPhotoPreview) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {profilePicturePreview && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      <p className="px-3 py-2 text-xs font-semibold text-slate-500">Profile Preview</p>
                      <img src={profilePicturePreview} alt="Profile preview" className="w-full h-40 object-cover" />
                    </div>
                  )}
                  {coverPhotoPreview && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      <p className="px-3 py-2 text-xs font-semibold text-slate-500">Cover Preview</p>
                      <img src={coverPhotoPreview} alt="Cover preview" className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Location</label>
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Write a short introduction"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mt-4">
                <button
                  onClick={handleSaveProfile}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            </div>
          )}

          {activeTab === 'bookmarks' && bookmarksLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Loading bookmarked posts...
            </div>
          ) : activeTab === 'posts' && userPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No posts yet.
            </div>
          ) : activeTab === 'media' && userPosts.filter((post) => getPostMedia(post).length > 0).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No media posts yet.
            </div>
          ) : activeTab === 'bookmarks' && bookmarkedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No bookmarked posts yet.
            </div>
          ) : (
            (activeTab === 'bookmarks' ? bookmarkedPosts : activeTab === 'media' ? userPosts.filter((post) => getPostMedia(post).length > 0) : userPosts).map((post) => (
              <div 
                key={post._id}
                className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <img 
                    src={getAvatar(profile)} 
                    alt={profile?.full_name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover bg-slate-100"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{profile?.full_name || 'User'}</h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                {post.content && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {getPostMedia(post).length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {getPostMedia(post).map((mediaItem, index) => {
                      const mediaUrl = resolveMediaUrl(mediaItem.url);
                      const mediaType = mediaItem.type || 'image';

                      if (!mediaUrl) return null;

                      if (mediaType === 'video' || mediaItem.mimetype?.startsWith('video')) {
                        return (
                          <video key={index} controls src={mediaUrl} className="w-full h-52 object-cover" />
                        );
                      }

                      if (mediaType === 'document' || mediaUrl.toLowerCase().endsWith('.pdf')) {
                        return (
                          <div key={index} className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{mediaItem.name || mediaItem.url?.split('/').pop()}</p>
                                <p className="text-xs text-slate-500">Document - click to open or download.</p>
                              </div>
                              <a href={mediaUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[#5c33f6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4a2ecc] transition-colors">
                                Open Document
                              </a>
                            </div>
                          </div>
                        );
                      }

                      if (mediaType === 'audio' || mediaItem.mimetype?.startsWith('audio')) {
                        return (
                          <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <audio controls src={mediaUrl} className="w-full" />
                          </div>
                        );
                      }

                      return (
                        <img key={index} src={mediaUrl} alt={mediaItem.type || 'Post media'} className="w-full h-52 object-cover" />
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}