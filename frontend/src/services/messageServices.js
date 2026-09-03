// Message Services - API calls for messaging functionality
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5234/api';

class MessageService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/messages`;
  }

  // Get auth headers with token and Clerk ID
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

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

  // Get all conversations for the current user
  async getConversations() {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages between current user and another user
  async getMessages(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message with optional media attachments
  async sendMessage(recipientId, content, media = []) {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          recipientId,
          content,
          media
        })
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const msg = errBody?.error || errBody?.message || JSON.stringify(errBody) || `HTTP ${response.status}`;
        const err = new Error(msg);
        err.status = response.status;
        err.body = errBody;
        throw err;
      }
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Upload message media files before sending
  async uploadMedia(files = []) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('authToken');
      const clerkId = localStorage.getItem('clerkId');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (clerkId) headers['x-clerk-id'] = clerkId;

      const response = await fetch(`${API_BASE_URL}/upload/message-media`, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to upload media files');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Mark message as read
  async markAsRead(messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/${messageId}/read`, {
        method: 'PUT',
        headers: this.getHeaders()
      });
      return response.json();
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/${messageId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();
