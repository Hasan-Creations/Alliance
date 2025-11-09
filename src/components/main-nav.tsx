
"use client";

import { useContext } from "react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  Sidebar,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/app-logo";
import { CheckSquare, Target, Wallet, Settings, LayoutDashboard } from "lucide-react";
import { AppViewContext, type View } from "@/context/app-view-context";

const menuItems: { href: View, label: string, icon: React.ElementType }[] = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "todos", label: "To-Do List", icon: CheckSquare },
  { href: "habits", label: "Habit Tracker", icon: Target },
  { href: "finance", label: "Finance Tracker", icon: Wallet },
  { href: "settings", label: "Settings", icon: Settings },
];

export function MainNav() {
  const { view, setView } = useContext(AppViewContext);

  return (
    <Sidebar>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={view === item.href}
                tooltip={item.label}
                onClick={() => setView(item.href)}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
