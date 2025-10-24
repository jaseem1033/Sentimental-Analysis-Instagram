import React, { useState, useEffect } from 'react';
import { Plus, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import ChildCard from '@/components/dashboard/ChildCard';
import { Child } from '@/types';
import { childrenAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const response = await childrenAPI.getChildren();
      setChildren(response.data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load child accounts.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = async () => {
    setIsAddingChild(true);
    try {
      // Redirect to Instagram OAuth flow
      await childrenAPI.addChild();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start Instagram authorization.',
      });
      setIsAddingChild(false);
    }
  };

  const handleDeleteChild = (childId: string) => {
    setChildren(children.filter(child => child.id !== childId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Parent Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor your children's social media sentiment
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleAddChild}
                disabled={isAddingChild}
                className="flex items-center space-x-2"
              >
                {isAddingChild ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add Child</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Children</p>
                  <p className="text-3xl font-bold text-foreground">{children.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Monitoring</p>
                  <p className="text-3xl font-bold text-foreground">{children.length}</p>
                </div>
                <div className="w-8 h-8 bg-sentiment-positive/20 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-sentiment-positive rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-3xl font-bold text-foreground">156</p>
                  <p className="text-xs text-muted-foreground">Comments analyzed</p>
                </div>
                <div className="text-sentiment-positive">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Child Accounts</h2>
            <Button variant="outline" onClick={loadChildren} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="dashboard-card animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : children.length === 0 ? (
            <Card className="dashboard-card">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No children added yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start monitoring by adding your first child's Instagram account.
                </p>
                <Button onClick={handleAddChild} disabled={isAddingChild}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Child
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  onDelete={handleDeleteChild}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;