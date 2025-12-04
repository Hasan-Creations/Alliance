
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
import { initiateEmailSignIn, useSignUp } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { AllianceSpinner } from '@/components/ui/alliance-spinner';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { initiateEmailSignUp } = useSignUp(); // Use the new hook

  useEffect(() => {
    // If the user is logged in, redirect them to the main router page.
    if (!isUserLoading && user) {
      router.replace('/'); 
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
      initiateEmailSignUp(auth, email, password, name, toast);
    } else {
      initiateEmailSignIn(auth, email, password, toast);
    }
  };

  // While loading or if user exists (and redirect is imminent), show a loader.
  if (isUserLoading || user) {
     return (
       <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AllianceSpinner />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render the login form if not loading and no user.
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
            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {isSignUp && (
              <>
                <div className="space-y-2 relative">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-7 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
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
