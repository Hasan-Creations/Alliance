
import type { Metadata, Viewport } from 'next';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppViewContextProvider } from '@/context/app-view-context';

export const metadata: Metadata = {
  title: 'Alliance',
  description: 'Organize your life, one task at a time.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#50207A',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className={cn("font-body antialiased", "overflow-x-hidden")}>
        <FirebaseClientProvider>
          <SidebarProvider>
            <AppViewContextProvider>
              {children}
            </AppViewContextProvider>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
