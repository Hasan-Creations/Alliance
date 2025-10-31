
import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | Alliance",
  description: "Your personal dashboard to track tasks, habits, and finances.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
