'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppViewContextProvider } from '@/context/app-view-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <AppViewContextProvider>
          {children}
        </AppViewContextProvider>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}