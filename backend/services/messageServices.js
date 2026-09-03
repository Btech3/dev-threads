import apiClient from './api.js';

export const messageServices = {
  // Get all conversations
  getConversations: async () => {
    try {
       const response = await apiClient.get('/messages');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages with specific user
  getMessages: async (userId) => {
    try {
      const response = await apiClient.get(`/messages/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (recipientId, content, media = null) => {
    try {
      const messageData = { recipientId, content };
      if (media) messageData.media = media;
      
      const response = await apiClient.post('/messages', messageData);
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const response = await apiClient.put(`/messages/${messageId}/read`);
      return response.data.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
};