import axios from 'axios';

// Get backend URL from environment variable or default to lacalhost or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5234/api';

// Create an Axios instance with the base URL
const API_BASE_URL = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type' : 'application/json',
    }
});

// Add interceptor to include JWT token in requests 
apiClient.interceptors.request.use((config)=> {
    //Get clert ID from Local storage (set by Clerk)
    const clerkId = localstorage.getItem('clerkId');

    if (clerkId) {
        config.headers['x-Clerk-ID'] = clerkId;
    }
    return config;
});

//Handle response errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            //Handle unauthorized - errors globally
            console.error('Unauthorized access - redirecting to login');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
