import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings | TaskNest",
  description: "Manage your application settings and data.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
