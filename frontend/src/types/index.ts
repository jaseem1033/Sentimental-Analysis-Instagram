export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Child {
  id: string;
  instagram_username: string;
  instagram_user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  created_at: string;
  instagram_id: string;
}

export interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}