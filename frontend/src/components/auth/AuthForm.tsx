import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';
import { authAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  type: 'login' | 'signup';
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'signup') {
        await authAPI.signup(formData);
        toast({
          title: 'Account created successfully!',
          description: 'Please log in with your credentials.',
        });
        navigate('/login');
      } else {
        const response = await authAPI.login({
          username: formData.username,
          password: formData.password,
        });
        
        // Get user data from backend response
        const userData = {
          id: response.data.user.id.toString(),
          username: response.data.user.username,
          email: response.data.user.email,
          created_at: new Date().toISOString(),
        };
        
        login(response.data.tokens, userData);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = type === 'signup' ? 'Failed to create account' : 'Invalid credentials';
      
      // Handle specific validation errors from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Handle field-specific validation errors
          const fieldErrors = [];
          if (errorData.username) fieldErrors.push(`Username: ${errorData.username[0]}`);
          if (errorData.email) fieldErrors.push(`Email: ${errorData.email[0]}`);
          if (errorData.password) fieldErrors.push(`Password: ${errorData.password[0]}`);
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join(', ');
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {type === 'signup' ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {type === 'signup' 
                ? 'Start monitoring your child\'s social media sentiment' 
                : 'Sign in to your parent dashboard'
              }
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            {type === 'login' ? (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {type === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              <Link 
                to={type === 'signup' ? '/login' : '/signup'}
                className="ml-1 text-primary hover:text-primary-hover font-medium"
              >
                {type === 'signup' ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;