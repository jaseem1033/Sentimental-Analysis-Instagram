import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Instagram, CheckCircle, XCircle } from 'lucide-react';
import { childrenAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const InstagramCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Instagram login...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Instagram login was cancelled or failed.');
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Invalid callback - missing authorization code.');
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      try {
        // Check if consent was given and get username
        const consentGiven = sessionStorage.getItem('consent_given') === 'true';
        const consentCode = sessionStorage.getItem('consent_code');
        const instagramUsername = sessionStorage.getItem('instagram_username');

        if (!consentGiven) {
          setStatus('error');
          setMessage('Consent not found or expired. Please start the process again.');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        if (!instagramUsername) {
          setStatus('error');
          setMessage('Instagram username not found. Please start the process again.');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }

        setMessage('Adding child account...');
        console.log('Starting OAuth completion with code:', code);

        // Complete OAuth with Instagram code, consent, and username
        console.log('Calling childrenAPI.completeOAuth...');
        const result = await childrenAPI.completeOAuth(code, true, instagramUsername);
        console.log('OAuth completion result:', result);

        // Update AuthContext with the user and tokens
        login(result.tokens, result.user);

        // Clear consent and username from storage
        sessionStorage.removeItem('consent_code');
        sessionStorage.removeItem('consent_given');
        sessionStorage.removeItem('instagram_username');

        setStatus('success');
        setMessage('Account added successfully! Your child\'s Instagram account is now being monitored.');

        toast({
          title: 'Success!',
          description: 'Child account has been added successfully.',
        });

        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error) {
        console.error('Instagram callback error:', error);
        setStatus('error');
        setMessage('Failed to add child account. Please try again.');
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add child account. Please try again.',
        });

        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Instagram className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {getIcon()}
          </div>
          <CardTitle className="text-xl">Instagram Integration</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'processing' && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Please wait...
            </div>
          )}

          {status === 'success' && (
            <p className="text-sm text-green-600">
              Redirecting to dashboard...
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-600">
              Redirecting to dashboard...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstagramCallback;