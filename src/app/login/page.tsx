
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard'); // Redirect to dashboard if already logged in
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Authentication service is not available. Please try again later.',
        });
        return;
    }
    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: 'Passwords do not match.',
        });
        return;
      }
      if (!agreedToTerms) {
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: 'You must agree to the terms and conditions.',
        });
        return;
      }
      initiateEmailSignUp(auth, email, password, name);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  if (isUserLoading || user) {
     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
             <AppLogo />
            </div>
          <CardTitle className="text-2xl">{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to get started.' : 'Sign in to continue to Alliance.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))} />
                    <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                        I agree to the{' '}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-primary" target="_blank">
                            Terms and Conditions
                        </Link>
                    </Label>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isSignUp && !agreedToTerms}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button variant="link" type="button" onClick={() => setIsSignUp(!isSignUp)} className="px-1">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
