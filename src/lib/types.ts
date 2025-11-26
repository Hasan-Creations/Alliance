
export type Priority = "High" | "Medium" | "Low";
export type HabitFrequency = "Daily" | "Weekly" | "Custom";
export type HabitCompletionStatus = 'completed' | 'missed';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type ExpenseSubType = "Need" | "Want";

export type HabitCompletion = {
  status: HabitCompletionStatus;
  timestamp?: number; // Optional: timestamp of completion
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
  createdAt: number;
}

export interface Habit {
  id: string;
  name: string;
  // Map of date (YYYY-MM-DD) to completion status object
  completions: Record<string, HabitCompletion>;
  createdAt: number;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface Transaction {
  id: string;
  accountId: string; // Source account for all types
  toAccountId?: string; // Destination account, ONLY for transfers
  date: Date; // Should be a Date object or Firestore Timestamp
  amount: number;
  description: string;
  category?: string; // Optional: not used for transfers
  type: TransactionType;
  subType?: ExpenseSubType; // For expenses: 'Need', 'Want'
  createdAt: number; // Timestamp in milliseconds
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense'; // To know if it's an income or expense category
}

export interface UserStartupSettings {
    startupPage: string;
}

export interface UserSettings {
    startup: UserStartupSettings;
}
