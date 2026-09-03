const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5234/api';

class ConnectionService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/connections`;
  }

  // Get auth headers
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

  async getFollowers(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/followers?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.json();
    } catch (error) {
      console.error('Error fetching followers:', error);
      throw error;
    }
  }

  async getFollowing(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/following?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch following');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching following:', error);
      throw error;
    }
  }

  async getConnections(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch connections');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }
  }

  async getPendingRequests(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/pending?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch pending requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  async followUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/follow`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to follow user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}/unfollow`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to unfollow user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async acceptFollowRequest(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/accept-request`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId })
      });
      return response.json();
    } catch (error) {
      console.error('Error accepting follow request:', error);
      throw error;
    }
  }

  async rejectFollowRequest(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/reject-request`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId })
      });
      return response.json();
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      throw error;
    }
  }

  async blockUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/block`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId })
      });
      return response.json();
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  async unblockUser(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/unblock`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId })
      });
      return response.json();
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  async getBlockedUsers(page = 1, limit = 20) {
    try {
      const response = await fetch(`${this.baseUrl}/blocked?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.json();
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }
  }
}

export const connectionService = new ConnectionService();
