import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access: string; refresh: string }, user: User) => void;
  logout: () => void;
  testLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (tokens: { access: string; refresh: string }, userData: User) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const testLogin = () => {
    // Set test authentication for debugging with real user jaseem1033
    const testTokens = {
      access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU5NjA2MDk3LCJpYXQiOjE3NTk2MDU3OTcsImp0aSI6IjA3YjEyMGFhOWM3ZDQwYmJiNmE4YmMwNjU2ZGZlMGM1IiwidXNlcl9pZCI6IjEzIn0.aZqwgaEgE_u97IvvajYdvqIY4WbzrW4SoIzMceSaDhY',
      refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1OTY5MTg4MiwiaWF0IjoxNzU5NjA1NDgyLCJqdGkiOiI4NDA0MzYxNjEzNjA0NzU0YjNjZGI4ZWY0NGQwMWRiOSIsInVzZXJfaWQiOiIxMyJ9.kUFn0hCfktNYEIQmSUA6dKSo10ye3hjfl6PVWHqGhno'
    };
    const testUser = {
      id: '13',
      username: 'jaseem1033',
      email: 'jaseem1033@gmail.com',
      created_at: new Date().toISOString()
    };
    login(testTokens, testUser);
    
    // Force navigation to dashboard after login
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 100);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    testLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};