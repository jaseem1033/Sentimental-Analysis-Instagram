import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Instagram, Shield, Eye, AlertCircle } from 'lucide-react';
import { childrenAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ChildConsent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [instagramUsername, setInstagramUsername] = useState('');
  const [usernameExists, setUsernameExists] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const oauthCode = searchParams.get('code');

  const checkUsernameExists = async (username: string) => {
    if (!username.trim()) {
      setUsernameExists(false);
      return;
    }

    try {
      const response = await childrenAPI.getChildren();
      const exists = response.data.some((child: any) => 
        child.instagram_username.toLowerCase() === username.trim().toLowerCase()
      );
      setUsernameExists(exists);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameExists(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInstagramUsername(value);
    
    // Clear previous timeout to prevent multiple calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced check
    timeoutRef.current = setTimeout(() => {
      checkUsernameExists(value);
    }, 500);
  };

  const handleAgree = async () => {
    if (!agreed) {
      toast({
        variant: 'destructive',
        title: 'Agreement Required',
        description: 'Please check the consent box to continue.',
      });
      return;
    }

    if (!instagramUsername.trim()) {
      toast({
        variant: 'destructive',
        title: 'Username Required',
        description: 'Please enter the Instagram username.',
      });
      return;
    }

    if (usernameExists) {
      toast({
        variant: 'destructive',
        title: 'Username Already Exists',
        description: 'A child account with this username already exists.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Store consent and username in sessionStorage
      const consentCode = 'consent_' + Date.now();
      sessionStorage.setItem('consent_given', 'true');
      sessionStorage.setItem('consent_code', consentCode);
      sessionStorage.setItem('instagram_username', instagramUsername.trim());
      
      // Redirect to Instagram OAuth for actual login
      const clientId = '751459870919841';
      const redirectUri = encodeURIComponent('https://brittani-unconcentrated-jeffery.ngrok-free.dev/auth/callback');
      const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights';
      
      const instagramOAuthUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${consentCode}`;
      
      window.location.href = instagramOAuthUrl;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process consent. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    toast({
      title: 'Setup Cancelled',
      description: 'No account was added to monitoring.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Instagram className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Parental Monitoring Consent</CardTitle>
          <p className="text-muted-foreground">
            Your parent would like to add your Instagram account to monitor the sentiment of comments on your posts.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              What this means:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 mt-0.5 text-primary" />
                Your parent will be able to see the sentiment analysis (positive, negative, neutral) of comments on your posts
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-primary" />
                Only comment sentiment is analyzed - your posts and private messages remain private
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-primary" />
                This helps your parent understand your online social interactions better
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="instagram-username" className="text-sm font-medium text-foreground">
              Instagram Username
            </label>
            <Input
              id="instagram-username"
              type="text"
              placeholder="Enter Instagram username (without @)"
              value={instagramUsername}
              onChange={handleUsernameChange}
              className={`w-full ${usernameExists ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {usernameExists && instagramUsername.trim() && (
              <p className="text-sm text-red-500">This username already exists</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(!!checked)}
                className="mt-1"
              />
              <label htmlFor="consent" className="text-sm text-foreground cursor-pointer">
                <span className="font-medium">I give my consent</span> for my parent to monitor the sentiment 
                of comments on my Instagram account. I understand this will help them 
                better support my online well-being.
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1"
              disabled={isLoading}
            >
              I Don't Agree
            </Button>
            <Button
              onClick={handleAgree}
              className="flex-1"
              disabled={!agreed || !instagramUsername.trim() || isLoading || usernameExists}
            >
              {isLoading ? 'Setting up...' : 'I Agree & Continue'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can revoke this consent at any time by asking your parent to remove your account 
            from their dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildConsent;