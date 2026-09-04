// Story service - fetch stories (reels)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev-threads-2.onrender.com/api';

class StoryService {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/stories`;
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const clerkId = localStorage.getItem('clerkId');
    if (clerkId) headers['x-clerk-id'] = clerkId;
    return headers;
  }

  async getFeedStories() {
    const res = await fetch(`${this.baseUrl}/feed`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch stories (${res.status})`);
    return await res.json();
  }

  async getUserStories(userId) {
    const res = await fetch(`${this.baseUrl}/${userId}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch user stories (${res.status})`);
    return await res.json();
  }
}

export const storyService = new StoryService();
