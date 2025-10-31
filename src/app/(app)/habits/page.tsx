import type { Metadata } from "next";
import { HabitsView } from "@/components/habits/habits-view";

export const metadata: Metadata = {
  title: "Habit Tracker | Alliance",
  description: "Build good habits and track your progress.",
};

export default function HabitsPage() {
  return <HabitsView />;
}
