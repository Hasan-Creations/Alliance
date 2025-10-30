import type { Metadata } from "next";
import { FinanceView } from "@/components/finance/finance-view";

export const metadata: Metadata = {
  title: "Finance Tracker | TaskNest",
  description: "Track your expenses and income, manage your budget.",
};

export default function FinancePage() {
  return <FinanceView />;
}
