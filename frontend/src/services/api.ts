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
  comments: [
    {
      id: '1',
      text: 'Love this post! So inspiring 💕',
      sentiment: 'positive' as const,
      confidence: 0.95,
      created_at: '2024-03-10T09:00:00Z',
      instagram_id: '001',
    },
    {
      id: '2',
      text: 'This is okay I guess',
      sentiment: 'neutral' as const,
      confidence: 0.78,
      created_at: '2024-03-10T10:30:00Z',
      instagram_id: '002',
    },
    {
      id: '3',
      text: 'I hate this content',
      sentiment: 'negative' as const,
      confidence: 0.92,
      created_at: '2024-03-10T11:15:00Z',
      instagram_id: '003',
    },
  ],
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
    return { data: response.data };
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

  completeOAuth: async (code: string, consent: boolean): Promise<{ child: Child; tokens: { access: string; refresh: string }; user: User }> => {
    if (!consent) {
      throw new Error('User consent required');
    }
    
    console.log('Making API call to /accounts/login/instagram/ with code:', code);
    // Call backend to exchange Instagram Business API code for tokens and create child
    const response = await api.post('/accounts/login/instagram/', { code });
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
      instagram_username: child.instagram_username,
      instagram_user_id: child.instagram_user_id,
      created_at: new Date().toISOString(), // Use current time since backend doesn't return created_at
    };
    
    return { 
      child: childData, 
      tokens: { access, refresh }, 
      user: userData 
    };
  },

  deleteChild: async (childId: string): Promise<ApiResponse<null>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: null };
  },
};

// Comments API
export const commentsAPI = {
  getComments: async (childId: string): Promise<ApiResponse<Comment[]>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockResponses.comments };
  },

  fetchComments: async (childId: string): Promise<ApiResponse<Comment[]>> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { data: mockResponses.comments };
  },
};

export default api;