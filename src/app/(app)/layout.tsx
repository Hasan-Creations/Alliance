
'use client';

import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useSidebar();

  return (
    <div className="flex min-h-screen w-full">
      <MainNav />
      <main className="flex-1 flex flex-col bg-background w-full">
        <div className="flex-1 py-4 sm:py-6 lg:py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
}
