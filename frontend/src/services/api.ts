import axios from 'axios';
import { AuthTokens, User, Child, Comment, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Mock API responses for now
const mockResponses = {
  children: [
    {
      id: '1',
      instagram_username: 'sarah_teen',
      instagram_user_id: '12345',
      created_at: '2024-01-15T10:30:00Z',
    },
    {
      id: '2', 
      instagram_username: 'alex_student',
      instagram_user_id: '67890',
      created_at: '2024-02-20T14:15:00Z',
    },
  ],
  comments: [],
};

// Auth API
export const authAPI = {
  signup: async (userData: { username: string; email: string; password: string }): Promise<ApiResponse<User>> => {
    const response = await api.post('/accounts/signup/', userData);
    return response.data;
  },

  login: async (credentials: { username: string; password: string }): Promise<ApiResponse<{ tokens: AuthTokens; user: User }>> => {
    const response = await api.post('/accounts/login/', credentials);
    return { data: response.data };
  },
};

// Children API
export const childrenAPI = {
  getChildren: async (): Promise<ApiResponse<Child[]>> => {
    const response = await api.get('/accounts/children/');
    // Transform backend response to frontend Child type
    const children: Child[] = response.data.map((child: any) => ({
      id: child.id.toString(),
      instagram_username: child.username, // Map username to instagram_username
      instagram_user_id: child.instagram_user_id,
      created_at: child.created_at || new Date().toISOString(), // Add fallback for created_at
    }));
    return { data: children };
  },

  addChild: async (): Promise<void> => {
    // Redirect to consent form first
    window.location.href = '/child-consent';
  },

  storeConsent: async (code: string, consent: boolean): Promise<ApiResponse<null>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Store consent in sessionStorage for later use
    if (consent) {
      sessionStorage.setItem('consent_code', code);
      sessionStorage.setItem('consent_given', 'true');
    }
    return { data: null };
  },

  completeOAuth: async (code: string, consent: boolean, username?: string): Promise<{ child: Child; tokens: { access: string; refresh: string }; user: User }> => {
    if (!consent) {
      throw new Error('User consent required');
    }
    
    console.log('Making API call to /accounts/login/instagram/ with code:', code, 'username:', username);
    // Call backend to exchange Instagram Business API code for tokens and create child
    const response = await api.post('/accounts/login/instagram/', { code, username });
    console.log('API response:', response.data);
    const { access, refresh, child, user } = response.data;
    
    // Convert backend user data to frontend User type
    const userData: User = {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      created_at: new Date().toISOString(),
    };
    
    // Convert backend child data to frontend Child type
    const childData: Child = {
      id: child.id.toString(),
      instagram_username: child.username, // Backend returns 'username' field
      instagram_user_id: child.instagram_user_id,
      created_at: child.created_at || new Date().toISOString(),
    };
    
    return { 
      child: childData, 
      tokens: { access, refresh }, 
      user: userData 
    };
  },

  deleteChild: async (childId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/accounts/children/${childId}/delete/`);
    return { data: null };
  },
};

// Comments API
export const commentsAPI = {
  getComments: async (childId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await api.get(`/accounts/children/${childId}/comments/`);
    return { data: response.data };
  },

  fetchComments: async (childId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await api.post(`/accounts/children/${childId}/fetch-comments/`);
    return { data: response.data.comments };
  },
};

export default api;