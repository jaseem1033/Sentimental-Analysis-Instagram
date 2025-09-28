import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, TrendingUp, Minus, TrendingDown } from 'lucide-react';
import { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  const getSentimentIcon = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4" />;
      case 'neutral':
        return <Minus className="h-4 w-4" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  const getSentimentBadgeClass = (sentiment: Comment['sentiment']) => {
    switch (sentiment) {
      case 'positive':
        return 'sentiment-positive border';
      case 'neutral':
        return 'sentiment-neutral border';
      case 'negative':
        return 'sentiment-negative border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (comments.length === 0) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Recent Comments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Recent Comments</span>
          <Badge variant="secondary" className="ml-auto">
            {comments.length} comments
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6 space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    className={`${getSentimentBadgeClass(comment.sentiment)} text-xs`}
                  >
                    <span className="flex items-center space-x-1">
                      {getSentimentIcon(comment.sentiment)}
                      <span className="capitalize">{comment.sentiment}</span>
                    </span>
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </div>
                </div>
                
                <p className="text-sm text-foreground leading-relaxed mb-2">
                  {comment.text}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>ID: {comment.instagram_id}</span>
                  <span>Confidence: {(comment.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CommentList;