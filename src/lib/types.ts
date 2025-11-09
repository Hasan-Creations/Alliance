

export type Priority = "High" | "Medium" | "Low";
export type HabitFrequency = "Daily" | "Weekly" | "Custom";
export type ExpenseType = "Need" | "Want";
export type HabitCompletionStatus = 'completed' | 'missed' | 'pending';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  // Map of date (YYYY-MM-DD) to completion status
  completions: Record<string, HabitCompletionStatus>;
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
  date: string;
  amount: number;
  description: string;
  category?: string; // Optional: not used for transfers
  type: TransactionType;
  subType?: ExpenseType; // For expenses: 'Need', 'Want'
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense'; // To know if it's an income or expense category
}

export interface UserStartupSettings {
    startupPage: string;
}


export interface AppData {
  tasks: Task[];
  habits: Habit[];
  accounts: Account[];
  transactions: Transaction[];
  transactionCategories: TransactionCategory[];
  settings: UserSettings;
}
