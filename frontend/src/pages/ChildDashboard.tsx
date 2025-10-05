import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Instagram, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import SentimentChart from '@/components/dashboard/SentimentChart';
import CommentList from '@/components/dashboard/CommentList';
import { Child, Comment, SentimentStats } from '@/types';
import { childrenAPI, commentsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ChildDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [child, setChild] = useState<Child | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    loadChildData();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(loadComments, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [id]);

  const loadChildData = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Fetch child data from API
      const response = await childrenAPI.getChildren();
      const childData = response.data.find((c: Child) => c.id === id);
      
      if (childData) {
        setChild(childData);
      } else {
        throw new Error('Child not found');
      }
      await loadComments();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load child data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    
    try {
      const response = await commentsAPI.getComments(id);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleFetchComments = async () => {
    if (!id) return;
    
    setIsFetching(true);
    try {
      const response = await commentsAPI.fetchComments(id);
      setComments(response.data);
      toast({
        title: 'Comments refreshed!',
        description: 'Latest comments have been fetched and analyzed.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch new comments.',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const calculateSentimentStats = (): SentimentStats => {
    const stats = comments.reduce(
      (acc, comment) => {
        acc[comment.sentiment]++;
        acc.total++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0, toxic: 0, total: 0 }
    );
    
    return stats;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-muted rounded"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Child not found</h1>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const sentimentStats = calculateSentimentStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Instagram className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">@{child.instagram_username}</h1>
                <p className="text-muted-foreground">Instagram Sentiment Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                Active Monitoring
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Added {new Date(child.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <Button 
              onClick={handleFetchComments}
              disabled={isFetching}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Fetching...' : 'Refresh Comments'}</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                  <p className="text-2xl font-bold text-foreground">{sentimentStats.total}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card border-sentiment-positive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Positive</p>
                  <p className="text-2xl font-bold text-sentiment-positive">{sentimentStats.positive}</p>
                </div>
                <div className="w-6 h-6 bg-sentiment-positive/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-sentiment-positive rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card border-sentiment-neutral/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Neutral</p>
                  <p className="text-2xl font-bold text-sentiment-neutral">{sentimentStats.neutral}</p>
                </div>
                <div className="w-6 h-6 bg-sentiment-neutral/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-sentiment-neutral rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card border-sentiment-negative/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Negative</p>
                  <p className="text-2xl font-bold text-sentiment-negative">{sentimentStats.negative}</p>
                </div>
                <div className="w-6 h-6 bg-sentiment-negative/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-sentiment-negative rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toxic</p>
                  <p className="text-2xl font-bold text-red-500">{sentimentStats.toxic}</p>
                </div>
                <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentChart stats={sentimentStats} />
          <CommentList comments={comments} />
        </div>
      </main>
    </div>
  );
};

export default ChildDashboard;