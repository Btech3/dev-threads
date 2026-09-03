import apiClient from './api.js';


export const userServices = {
  // Get user profile
  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/users/profile/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      const response = await apiClient.put(`/users/profile/${userId}`, profileData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    try {
      const response = await apiClient.get('/users/search', {
        params: { q: query, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Get user stats
  getStats: async (userId) => {
    try {
      const response = await apiClient.get(`/users/stats/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};