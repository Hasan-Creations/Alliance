'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/app-logo';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { View } from '@/context/app-view-context';
import { LayoutDashboard, CheckSquare, Target, Wallet, StickyNote } from 'lucide-react';
import { AllianceSpinner } from '@/components/ui/alliance-spinner';
import { cn } from '@/lib/utils';

const startupOptions: { value: View; label: string; icon: React.ElementType }[] = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'todos', label: 'To-Do List', icon: CheckSquare },
  { value: 'habits', label: 'Habit Tracker', icon: Target },
  { value: 'finance', label: 'Finance Tracker', icon: Wallet },
  { value: 'notes', label: 'Notes', icon: StickyNote },
];

export default function InitialSetupPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState<View>('dashboard');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!firestore || !user) return;
    setIsSaving(true);

    const settingsRef = doc(firestore, 'users', user.uid, 'settings', 'startup');
    setDocumentNonBlocking(settingsRef, { startupPage: selectedPage }, { merge: true });

    // Allow a brief moment for the write to likely complete before redirecting
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  if (isUserLoading || isSaving) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AllianceSpinner />
          <p className="text-muted-foreground">{isSaving ? 'Saving your preference...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // If user is not logged in, they shouldn't be here.
    // Redirect to login, but this should ideally not happen in the intended flow.
    if (typeof window !== 'undefined') {
        router.replace('/login');
    }
    return null;
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AppLogo />
          </div>
          <CardTitle className="text-2xl">Welcome to Alliance!</CardTitle>
          <CardDescription>
            Let's get you set up. Choose which page you'd like to see every time you open the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPage}
            onValueChange={(value: View) => setSelectedPage(value)}
            className="space-y-2"
          >
            {startupOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedPage === option.value && "border-primary bg-primary/10"
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <option.icon className="h-5 w-5 text-muted-foreground" />
                <span>{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
          <Button onClick={handleSave} className="w-full mt-6">
            Continue to App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
