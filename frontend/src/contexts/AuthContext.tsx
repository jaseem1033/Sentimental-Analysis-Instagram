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
    // Set test authentication for debugging
    const testTokens = {
      access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU5MDg2MzIxLCJpYXQiOjE3NTkwODYwMjEsImp0aSI6ImNhMTBmNTQzNmQzZjRkZWZhMTFhZmZiNjNkNDIwOTkzIiwidXNlcl9pZCI6IjcifQ.IQ1UcfwLuY08BS7TMEF4ikcsejcuVZHL0ZaPlweKvkI',
      refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc1OTE3MjQyMSwiaWF0IjoxNzU5MDg2MDIxLCJqdGkiOiI5ZGIzYmEyNDRiYTA0MGViOGJiNDZmODU1OTEzNjNmYyIsInVzZXJfaWQiOiI3In0.rblGkx7bAD1pMx3ZcOXQ_gyP0I-dDeuWVish8f9PbE4'
    };
    const testUser = {
      id: '7',
      username: 'testuser',
      email: 'test@example.com',
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