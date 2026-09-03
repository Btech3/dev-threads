import apiClient from './api.js';

export const connectionServices = {
  // Follow user
  followUser: async (userId) => {
    try {
      const response = await apiClient.post(`/connections/${userId}/follow`);
      return response.data.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    try {
      const response = await apiClient.post(`/connections/${userId}/unfollow`);
      return response.data.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Get followers
  getFollowers: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/connections/followers', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  },

  // Get following
  getFollowing: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/connections/following', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  },

  // Get all connections
  getConnections: async () => {
    try {
      const response = await apiClient.get('/connections');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }
};