import apiClient from './api.js';

export const storyServices = {
  // Create story
  createStory: async (storyData) => {
    try {
      const response = await apiClient.post('/stories', storyData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  // Get user stories
  getUserStories: async (userId) => {
    try {
      const response = await apiClient.get(`/stories/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
  },

  // Get feed stories
  getFeedStories: async () => {
    try {
      const response = await apiClient.get('/stories/feed');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching feed stories:', error);
      throw error;
    }
  },

  // Delete story
  deleteStory: async (storyId) => {
    try {
      await apiClient.delete(`/stories/${storyId}`);
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
};