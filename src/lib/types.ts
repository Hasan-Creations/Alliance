

export type Priority = "High" | "Medium" | "Low";
export type HabitFrequency = "Daily" | "Weekly" | "Custom";
export type ExpenseType = "Need" | "Want" | "Savings";
export type HabitCompletionStatus = 'completed' | 'missed' | 'pending';

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

export interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: ExpenseType;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
}

export interface IncomeCategory {
    id: string;
    name: string;
}

export interface UserSettings {
    dailySummary: boolean;
    taskReminders: boolean;
    overdueAlerts: boolean;
    motivationalMessages: boolean;
}

export interface UserStartupSettings {
    startupPage: string;
}


export interface AppData {
  tasks: Task[];
  habits: Habit[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  incomes: Income[];
  incomeCategories: IncomeCategory[];
  settings: UserSettings;
}
