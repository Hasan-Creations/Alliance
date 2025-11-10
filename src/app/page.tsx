
'use client';

import React from "react";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import WelcomePage from "./welcome/page";
import AppPage from "./(app)/page";

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }

  return (
    <AppPage />
  );
}
