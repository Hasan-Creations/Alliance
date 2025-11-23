
'use client';

import React from "react";
import { useUser } from "@/firebase";
import WelcomePage from "./welcome/page";
import { AllianceSpinner } from "@/components/ui/alliance-spinner";
import { AppLayout } from "@/components/app-layout";

export default function AppPage() {
  const { user, isUserLoading } = useUser();
  
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AllianceSpinner />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }
  
  return <AppLayout />;
}
