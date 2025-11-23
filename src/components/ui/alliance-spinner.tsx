'use client';

import React from 'react';
import { cn } from "@/lib/utils";

interface AllianceSpinnerProps {
  size?: number;
  className?: string;
}

export function AllianceSpinner({ size = 100, className }: AllianceSpinnerProps) {
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <div 
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 35%, hsl(var(--accent)))`,
          filter: 'blur(1px)',
          boxShadow: `
            0px -5px 20px 0px hsl(var(--primary) / 0.6),
            0px 5px 20px 0px hsl(var(--accent) / 0.6)
          `,
          animation: 'spinning 1.7s linear infinite',
        }}
      />
      <div 
        className="absolute inset-0 rounded-full bg-background"
        style={{
          filter: 'blur(8px)',
          margin: '2px', // Slight inset to show the gradient border
        }}
      />
    </div>
  );
}