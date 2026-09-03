const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5234/api';

class UserService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/users`;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Get Clerk ID from localStorage
  getClerkId() {
    return localStorage.getItem('clerkId');
  }

  // Get headers with auth
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const clerkId = this.getClerkId();
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

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch current user');
      return await response.json();
    } catch (error) {
      console.error('getCurrentUser error:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch user');
      return await response.json();
    } catch (error) {
      console.error('getUserById error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      const result = await response.json();
      return result.user || result;
    } catch (error) {
      console.error('updateProfile error:', error);
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'x-clerk-id': this.getClerkId(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to upload profile picture');
      }
      return await response.json();
    } catch (error) {
      console.error('uploadProfilePicture error:', error);
      throw error;
    }
  }

  // Upload cover photo
  async uploadCoverPhoto(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload/cover-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'x-clerk-id': this.getClerkId(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to upload cover photo');
      }
      return await response.json();
    } catch (error) {
      console.error('uploadCoverPhoto error:', error);
      throw error;
    }
  }

  // Get user by Clerk ID (for initial setup)
  async getUserByClerkId(clerkId) {
    try {
      const response = await fetch(`${this.baseURL}/clerk/${clerkId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) return null; // User doesn't exist yet
      return await response.json();
    } catch (error) {
      console.error('getUserByClerkId error:', error);
      return null;
    }
  }

  // Create new user after Clerk signup
  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Failed to create user');
      const result = await response.json();
      return result.user || result;
    } catch (error) {
      console.error('createUser error:', error);
      throw error;
    }
  }

  // Get user suggestions (for discover page)
  async getUserSuggestions(limit = 10) {
    try {
      const response = await fetch(`${this.baseURL}/suggestions?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return await response.json();
    } catch (error) {
      console.error('getUserSuggestions error:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query) {
    try {
      const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to search users');
      return await response.json();
    } catch (error) {
      console.error('searchUsers error:', error);
      throw error;
    }
  }

  // Get user stats
  async getUserStats(userId) {
    try {
      const response = await fetch(`${this.baseURL}/${userId}/stats`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    } catch (error) {
      console.error('getUserStats error:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
