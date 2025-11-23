'use client';

import { cn } from "@/lib/utils";

interface AllianceSpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  variant?: 'cosmic' | 'quantum' | 'nebula' | 'pulse' | 'orbit';
}

export function AllianceSpinner({ 
  size = 48, 
  variant = 'cosmic',
  className, 
  ...props 
}: AllianceSpinnerProps) {
  // Pulse variant - Simple but elegant
  if (variant === 'pulse') {
    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-primary/50 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-accent animate-pulse delay-75" />
        <div className="absolute inset-6 rounded-full bg-secondary animate-pulse delay-150" />
      </div>
    );
  }

  // Orbit variant - Planetary motion
  if (variant === 'orbit') {
    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }}>
        <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-orbit-1" />
        </div>
        <div className="absolute top-1/2 right-0 w-2 h-2 -mt-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-orbit-2" />
        </div>
        <div className="absolute bottom-0 left-1/2 w-2 h-2 -ml-1">
          <div className="w-2 h-2 rounded-full bg-secondary animate-orbit-3" />
        </div>
        <div className="absolute top-1/2 left-0 w-2 h-2 -mt-1">
          <div className="w-2 h-2 rounded-full bg-chart-4 animate-orbit-4" />
        </div>
      </div>
    );
  }

  // Quantum variant - Multiple rotating elements
  if (variant === 'quantum') {
    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }}>
        <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-quantum-1" />
        <div className="absolute inset-2 border-2 border-accent/40 rounded-full animate-quantum-2" />
        <div className="absolute inset-4 border-2 border-secondary/50 rounded-full animate-quantum-3" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-foreground rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // Nebula variant - Gradient waves
  if (variant === 'nebula') {
    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent animate-nebula-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-accent to-secondary animate-nebula-pulse delay-300" />
        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-secondary to-primary animate-nebula-pulse delay-600" />
      </div>
    );
  }

  // Default Cosmic variant - Most sophisticated
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className="absolute inset-0 cosmic-spinner"
        {...props}
      >
        {/* Outer ring - primary with animated dash */}
        <circle
          className="stroke-primary fill-none"
          cx="24"
          cy="24"
          r="20"
          strokeWidth="2"
          strokeDasharray="120 40"
          opacity="0.8"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 24 24"
            to="360 24 24"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Middle ring - accent with pulse */}
        <circle
          className="stroke-accent fill-none"
          cx="24"
          cy="24"
          r="14"
          strokeWidth="3"
          strokeDasharray="80 30"
          opacity="0.7"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 24 24"
            to="0 24 24"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.8;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Inner ring - secondary with scale */}
        <circle
          className="stroke-secondary fill-none"
          cx="24"
          cy="24"
          r="8"
          strokeWidth="4"
          strokeDasharray="40 20"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 24 24"
            to="-360 24 24"
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Central core with glow */}
        <circle
          className="fill-accent animate-pulse"
          cx="24"
          cy="24"
          r="3"
          filter="url(#glow)"
        />
        
        {/* Orbiting dots */}
        <circle className="fill-chart-1 cosmic-dot-1" cx="24" cy="8" r="1.5" />
        <circle className="fill-chart-2 cosmic-dot-2" cx="24" cy="8" r="1.5" />
        <circle className="fill-chart-3 cosmic-dot-3" cx="24" cy="8" r="1.5" />
        
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}