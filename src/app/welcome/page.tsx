
'use client';

import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";
import Link from "next/link";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useRemoteConfigValue } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function WelcomePage() {
  const welcomeImage = PlaceHolderImages[0];
  const { value: welcomeHeadline, loading: isLoadingHeadline } = useRemoteConfigValue('welcome_headline');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AppLogo />
      </header>
      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="text-center md:text-left">
              {isLoadingHeadline ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-foreground mb-4">
                  {welcomeHeadline?.asString() || "Organize your life, achieve your goals."}
                </h1>
              )}
              <p className="text-lg text-muted-foreground mb-8">
                Alliance is the all-in-one platform to manage your tasks, track your habits, and master your finances. Stop juggling apps and start building a more organized life today.
              </p>
              <Button asChild size="lg">
                <Link href="/login">Get Started for Free</Link>
              </Button>
            </div>
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden shadow-xl">
               <Image
                src={welcomeImage.imageUrl}
                alt={welcomeImage.description}
                fill
                style={{ objectFit: 'cover' }}
                data-ai-hint={welcomeImage.imageHint}
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground text-sm">
        <div className="flex justify-center gap-4">
          <span>&copy; {new Date().getFullYear()} Alliance. All rights reserved.</span>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
