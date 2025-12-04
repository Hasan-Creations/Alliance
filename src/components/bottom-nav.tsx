
"use client";

import { useContext } from "react";
import { CheckSquare, Target, Wallet, Settings, LayoutDashboard, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppViewContext, type View } from "@/context/app-view-context";

const menuItems: { href: View, label: string, icon: React.ElementType }[] = [
  { href: "todos", label: "To-Do", icon: CheckSquare },
  { href: "habits", label: "Habits", icon: Target },
  { href: "finance", label: "Finance", icon: Wallet },
  { href: "notes", label: "Notes", icon: StickyNote },
  { href: "settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const { view, setView } = useContext(AppViewContext);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-t-lg md:hidden">
      <div className="grid h-16 grid-cols-5">
        {menuItems.map((item) => {
          const isActive = view === item.href;
          return (
            <button
              key={item.href}
              onClick={() => setView(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors p-1",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
              
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
