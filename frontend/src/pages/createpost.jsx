/**
 * Create Post Page Component
 * 
 * Allows users to:
 * - Write post content (up to 5000 characters)
 * - Upload multiple media files (images, videos, documents)
 * - Real-time file preview
 * - Post publishing with real-time broadcast to feed
 * - Stay on page after successful post (no auto-redirect)
 */

import { useState, useRef, useEffect } from 'react';
import { Menu, X, Image as ImageIcon, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { assets, menuItemsData } from '../assets/assets.js';
import { postService } from '../services/postService.js';
import { useAppAuth } from '../context/AuthContext';

export default function Createpost() {
  const navigate = useNavigate();
  const { appUser } = useAppAuth();
  const fileInputRef = useRef(null);
  const currentUser = appUser || {
    full_name: 'Your Profile',
    username: 'your_username',
    profile_picture: ''
  };
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreview, setFilePreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const getAvatar = (user) => {
    if (user?.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ============================================
  // FILE HANDLING
  // ============================================

  /**
   * Handle file selection from input
   */
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length + selectedFiles.length > 5) {
      setError('Maximum 5 files per post');
      return;
    }

    // Validate file sizes (10MB max per file)
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles([...selectedFiles, ...validFiles]);
    setError(null);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(prev => [...prev, {
          name: file.name,
          type: file.type,
          preview: event.target.result,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Remove a file from selection
   */
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreview(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Get media type from file
   */
  const getMediaType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  // ============================================
  // POST SUBMISSION
  // ============================================

  /**
   * Handle post creation with file uploads
   * Uses FormData to support multipart/form-data
   */
  const handlePublishPost = async (e) => {
    e.preventDefault();
    
    try {
      // ============================================
      // 1. VALIDATION
      // ============================================
      
      if (!postContent.trim()) {
        setError('Post content is required');
        return;
      }

      if (postContent.length > 5000) {
        setError('Post exceeds maximum length of 5000 characters');
        return;
      }

      if (postContent.trim().length === 0 && selectedFiles.length === 0) {
        setError('Post must have either content or media');
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      // ============================================
      // 2. PREPARE FORM DATA
      // ============================================

      console.log('📤 Uploading post with', selectedFiles.length, 'files...');
      
      // Use postService to create post
      const response = await postService.createPost(postContent.trim(), selectedFiles);

      // ============================================
      // 3. SUCCESS HANDLING
      // ============================================

      if (response && (response.post || response._id)) {
        console.log('✅ Post created successfully:', response.post?._id || response._id);
        
        setSuccess(true);
        setSuccessMessage(`Post published successfully! 🎉`);
        
        // Reset form but keep user on page
        setPostContent('');
        setSelectedFiles([]);
        setFilePreview([]);
        setUploadProgress(0);
      } else {
        throw new Error('No post returned from server');
      }

    } catch (error) {
      console.error('❌ Post creation error:', error);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create post. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Handle specific auth errors
      if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
        errorMessage = '🔐 Authentication failed - Please log in again';
      } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        errorMessage = '🌐 Network error - Check your connection or try again';
      } else if (errorMessage.includes('file') || errorMessage.includes('File')) {
        errorMessage = '📁 ' + errorMessage;
      }
      
      console.error('📌 Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* MOBILE HEADER BUTTON */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 text-slate-600 hover:text-slate-800 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* MOBILE OVERLAY NAVIGATION */}
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
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    item.label === 'Create Post' ? 'bg-[#eef0ff] text-[#5c33f6]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(currentUser)} alt={currentUser.full_name} className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{currentUser.full_name}</h4>
            <span className="text-xs text-slate-400 truncate block">@{currentUser.username}</span>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* MAIN CONTENT */}
      <main className="p-6 sm:p-8 md:p-12 max-w-3xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Create Post</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Share your thoughts, media, and ideas with the world</p>
        </header>

        {/* STATUS MESSAGES */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-700">{successMessage}</p>
              <p className="text-xs text-green-600 mt-1">Feel free to create another post or navigate to your feed</p>
            </div>
          </div>
        )}

        {/* POST FORM */}
        <form onSubmit={handlePublishPost} className="space-y-6">
          {/* USER INFO CARD */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <img 
                src={getAvatar(currentUser)} 
                alt={currentUser.full_name} 
                className="w-12 h-12 rounded-full object-cover bg-slate-100"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">{currentUser.full_name}</h3>
                <span className="text-xs text-slate-500">@{currentUser.username}</span>
              </div>
            </div>
          </div>

          {/* CONTENT TEXTAREA */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <textarea
              value={postContent}
              onChange={(e) => {
                setPostContent(e.target.value);
                setError(null);
              }}
              placeholder="What's on your mind? Share your thoughts, ideas, and moments..."
              rows={6}
              maxLength={5000}
              className="w-full text-base text-slate-800 placeholder-slate-400 focus:outline-none resize-none bg-transparent"
            />
            <div className="mt-3 text-xs text-slate-400 text-right">
              {postContent.length} / 5000
            </div>
          </div>

          {/* FILE PREVIEWS */}
          {filePreview.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filePreview.map((file, index) => (
                <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 relative group shadow-sm">
                  {/* Preview Image/Video Thumbnail */}
                  {file.type.startsWith('image/') && (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}
                  {file.type.startsWith('video/') && (
                    <video 
                      src={file.preview}
                      className="w-full h-40 object-cover rounded-lg mb-3 bg-slate-900"
                    />
                  )}

                  {/* File Info */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {getMediaType(file)} • {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* FILE UPLOAD INPUT (HIDDEN) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isSubmitting}
          />

          {/* ACTION BUTTONS */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || selectedFiles.length >= 5}
              className="p-2.5 text-slate-600 hover:text-[#5c33f6] hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Add Media</span>
              {selectedFiles.length > 0 && (
                <span className="text-xs bg-[#5c33f6] text-white px-2 py-0.5 rounded-full">
                  {selectedFiles.length}/5
                </span>
              )}
            </button>

            <button 
              type="submit"
              disabled={!postContent.trim() || isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center space-x-2 ${
                postContent.trim() && !isSubmitting
                  ? 'bg-[#5c33f6] text-white hover:bg-[#4a24e3] active:scale-95 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>Publish Post</span>
                </>
              )}
            </button>
          </div>

          {/* UPLOAD PROGRESS */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">Uploading...</p>
                <p className="text-xs text-slate-500">{uploadProgress}%</p>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#5c33f6] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}