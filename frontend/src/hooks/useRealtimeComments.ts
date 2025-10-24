import { useEffect, useRef, useState } from 'react';
import { commentsAPI } from '../services/api';

interface RealtimeCommentsResult {
  totalNewComments: number;
  childrenUpdated: number;
  results: Array<{
    child_id: number;
    username: string;
    new_comments: number;
    status: 'success' | 'error';
    error?: string;
  }>;
  isPolling: boolean;
  error: string | null;
}

export const useRealtimeComments = (intervalMs: number = 5000) => {
  const [data, setData] = useState<RealtimeCommentsResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsPolling(true);
    setError(null);
    
    // Initial fetch
    fetchComments();
    
    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchComments();
    }, intervalMs);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.fetchAllChildrenComments();
      setData(response.data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
      console.error('Error fetching real-time comments:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    isPolling,
    error,
    startPolling,
    stopPolling,
    fetchComments
  };
};
