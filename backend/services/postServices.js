import apiClient from './api.js';

export const postServices = {
  // Get feed (all posts)
  getFeed: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/posts/feed', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  },

  // Create new post
  createPost: async (postData) => {
    try {
      const response = await apiClient.post('/posts', postData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Get single post
  getPost: async (postId) => {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const response = await apiClient.put(`/posts/${postId}`, postData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Like post
  likePost: async (postId) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Unlike post
  unlikePost: async (postId) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/unlike`);
      return response.data.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  // Add comment
  addComment: async (postId, text) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comment`, { text });
      return response.data.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    try {
      await apiClient.delete(`/posts/${postId}/comment/${commentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
};