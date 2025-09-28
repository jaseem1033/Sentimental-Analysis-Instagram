import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, BarChart, Instagram, Calendar } from 'lucide-react';
import { Child } from '@/types';
import { childrenAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ChildCardProps {
  child: Child;
  onDelete: (childId: string) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onDelete }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await childrenAPI.deleteChild(child.id);
      onDelete(child.id);
      toast({
        title: 'Child account removed',
        description: `${child.instagram_username} has been removed from monitoring.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove child account.',
      });
    }
  };

  const handleViewDashboard = () => {
    navigate(`/child/${child.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="dashboard-card group hover:scale-[1.02] transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Instagram className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">@{child.instagram_username}</h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Added {formatDate(child.created_at)}</span>
            </div>
          </div>
        </div>
        
        <Badge variant="secondary" className="bg-secondary/10 text-secondary">
          Active
        </Badge>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Instagram ID: {child.instagram_user_id.slice(0, 8)}...</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDashboard}
              className="flex items-center space-x-2"
            >
              <BarChart className="h-4 w-4" />
              <span>View Dashboard</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;