// Post Service - API calls for post functionality
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5234/api';

class PostService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/posts`;
  }

  // Helper to normalize a server response into a post object
  async normalizePostFromResponse(response) {
    try {
      const json = await response.json().catch(() => null);
      if (!json) return null;
      if (json.post) return json.post;
      if (json.data && json.data.post) return json.data.post;
      if (json.data) return json.data;
      return json;
    } catch (e) {
      return null;
    }
  }

  // Get auth headers with token and Clerk ID (for JSON requests)
  getHeaders(includeContentType = true) {
    const headers = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const clerkId = localStorage.getItem('clerkId');
    if (clerkId) {
      headers['x-clerk-id'] = clerkId;
    }

    // Add user email and name for auto-user-creation fallback
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      headers['x-clerk-email'] = userEmail;
    }

    const userName = localStorage.getItem('userName');
    if (userName) {
      headers['x-clerk-name'] = userName;
    }

    return headers;
  }

  // Get headers for FormData (no Content-Type for multipart)
  getFormDataHeaders() {
    const headers = {};

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const clerkId = localStorage.getItem('clerkId');
    if (clerkId) {
      headers['x-clerk-id'] = clerkId;
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      headers['x-clerk-email'] = userEmail;
    }

    const userName = localStorage.getItem('userName');
    if (userName) {
      headers['x-clerk-name'] = userName;
    }

    return headers;
  }

  // Get feed posts
  async getFeed(page = 1, limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/feed?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch feed`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  }

  // Get posts by user
  async getUserPosts(userId, page = 1, limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user posts`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }

  // Get a single post
  async getPost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch post`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  // Create a post with media (text, images, videos)
  async createPost(content, files = []) {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      const clerkId = localStorage.getItem('clerkId');
      
      console.log('🔐 Auth check - Token exists:', !!token, 'ClerkId exists:', !!clerkId);
      
      if (!token) {
        throw new Error('🔐 Authentication failed: Missing token - Please log in again');
      }
      
      if (!clerkId) {
        throw new Error('🔐 Authentication failed: Missing Clerk ID - Please log in again');
      }

      const formData = new FormData();
      formData.append('content', content);
      
      // Add all media files
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('media', file);
        });
      }

      console.log(`📤 Creating post with ${files.length} files...`);
      console.log(`🔐 Auth headers - Token: ${token ? 'present' : 'MISSING'}, ClerkID: ${clerkId ? 'present' : 'MISSING'}`);

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: formData
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: response.statusText };
        }
        
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Failed to create post`;
        
        // Add context to errors
        if (response.status === 401) {
          throw new Error(`🔐 Unauthorized (401): ${errorMessage} - Your session may have expired. Please log in again.`);
        } else if (response.status === 400) {
          throw new Error(`📋 Invalid request (400): ${errorMessage}`);
        } else if (response.status >= 500) {
          throw new Error(`⚠️ Server error (${response.status}): ${errorMessage} - Please try again later`);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Post created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }

  // Update a post
  async updatePost(postId, content, files = []) {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append('media', file);
        });
      }

      const response = await fetch(`${this.baseUrl}/${postId}`, {
        method: 'PUT',
        headers: this.getFormDataHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update post`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Delete a post
  async deletePost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete post`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Like a post
  async likePost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/like`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        // Try to parse error and if it's an idempotency case, refetch the post
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || '';
        if (response.status === 400 && /already liked|already exists|duplicate/i.test(errMsg)) {
          // fetch latest post state to sync client
          const postResp = await this.getPost(postId).catch(() => null);
          const post = postResp?.post || postResp?.data || postResp;
          return { post };
        }
        const errorMessage = errMsg || `HTTP ${response.status}: Failed to like post`;
        throw new Error(errorMessage);
      }

      // Prefer returning normalized post if present
      const okJson = await response.json().catch(() => null);
      if (okJson && (okJson.post || okJson.data)) return okJson;
      return okJson;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  // Unlike a post
  async unlikePost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/unlike`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || '';
        if (response.status === 400 && /not liked|cannot unlike|invalid/i.test(errMsg)) {
          // sync client with latest post
          const postResp = await this.getPost(postId).catch(() => null);
          const post = postResp?.post || postResp?.data || postResp;
          return { post };
        }
        const errorMessage = errMsg || `HTTP ${response.status}: Failed to unlike post`;
        throw new Error(errorMessage);
      }

      const okJson = await response.json().catch(() => null);
      if (okJson && (okJson.post || okJson.data)) return okJson;
      return okJson;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  }

  // Add comment to post
  async addComment(postId, text) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/comment`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP ${response.status}: Failed to add comment`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Delete comment
  async deleteComment(postId, commentId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/comment/${commentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete comment`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Reply to a comment
  async replyToComment(postId, commentId, text) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/comment/${commentId}/reply`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP ${response.status}: Failed to reply to comment`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }

  // React to a comment with an emoji
  async reactToComment(postId, commentId, emoji) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/comment/${commentId}/react`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ emoji })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP ${response.status}: Failed to react to comment`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reacting to comment:', error);
      throw error;
    }
  }

  // Share a post
  async sharePost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/share`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP ${response.status}: Failed to share post`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }

  // Unshare a post (toggle unshare)
  async unsharePost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/unshare`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to unshare post`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error unsharing post:', error);
      throw error;
    }
  }

  // Bookmark a post
  async bookmarkPost(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/bookmark`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || '';
        if (response.status === 400 && /already bookmarked|already exists/i.test(errMsg)) {
          const postResp = await this.getPost(postId).catch(() => null);
          const post = postResp?.post || postResp?.data || postResp;
          return { post };
        }
        const errorMessage = errMsg || `HTTP ${response.status}: Failed to bookmark post`;
        throw new Error(errorMessage);
      }

      const okJson = await response.json().catch(() => null);
      if (okJson && (okJson.post || okJson.data)) return okJson;
      return okJson;
    } catch (error) {
      console.error('Error bookmarking post:', error);
      throw error;
    }
  }

  // Remove bookmark
  async removeBookmark(postId) {
    try {
      const response = await fetch(`${this.baseUrl}/${postId}/bookmark`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error || errJson?.message || '';
        if (response.status === 400 && /not bookmarked|cannot remove|invalid/i.test(errMsg)) {
          const postResp = await this.getPost(postId).catch(() => null);
          const post = postResp?.post || postResp?.data || postResp;
          return { post };
        }
        const errorMessage = errMsg || `HTTP ${response.status}: Failed to remove bookmark`;
        throw new Error(errorMessage);
      }

      const okJson = await response.json().catch(() => null);
      if (okJson && (okJson.post || okJson.data)) return okJson;
      return okJson;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }
}

export const postService = new PostService();
