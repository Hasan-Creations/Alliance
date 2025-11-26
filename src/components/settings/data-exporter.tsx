'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import ExcelJS, { type Worksheet, type Column, type Cell, type Row, type Style, type Font } from 'exceljs';
import type { Task, Habit, Transaction, Account } from '@/lib/types';
import { Download, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface DataExporterProps {
  compact?: boolean;
}

export function DataExporter({ compact = false }: DataExporterProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const tasksRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [user, firestore]);
  const habitsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'habits') : null, [user, firestore]);
  const transactionsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [user, firestore]);
  const accountsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'accounts') : null, [user, firestore]);

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksRef);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsRef);
  
  const { data: rawTransactions, isLoading: loadingTransactions } = useCollection<Omit<Transaction, 'date'> & { date: any }>(transactionsRef);

  const transactions = useMemo(() => {
    if (!rawTransactions) return null;
    return rawTransactions.map(t => ({
      ...t,
      // The `date` can be a Firestore Timestamp, so we convert it to a JS Date object.
      // It might also already be a Date object if it's from the local cache.
      date: t.date?.toDate ? t.date.toDate() : (t.date as Date),
    }));
  }, [rawTransactions]);
  
  const { data: accounts, isLoading: loadingAccounts } = useCollection<Account>(accountsRef);

  const isLoading = loadingTasks || loadingHabits || loadingTransactions || loadingAccounts;

  const availableMonths = useMemo(() => {
    const allData = [...(tasks ?? []), ...(transactions ?? []), ...(habits?.flatMap(h => Object.keys(h.completions).map(date => ({ date }))) ?? [])];
    const months = new Set<string>();

    allData.forEach(item => {
      const itemDateSource = (item as any).dueDate || (item as any).date;
      if (itemDateSource) {
        try {
            const itemDate = typeof itemDateSource === 'string' ? parseISO(itemDateSource) : itemDateSource as Date;
            if(!isNaN(itemDate.getTime())) {
                months.add(format(startOfMonth(itemDate), 'yyyy-MM'));
            }
        } catch (e) {
          console.warn(`Invalid date format found: ${itemDateSource}`);
        }
      }
    });

    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [tasks, transactions, habits]);
  
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const autoFitColumns = (sheet: Worksheet) => {
    sheet.columns.forEach((column: Partial<Column>) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell: Cell, rowNumber: number) => {
        const isHeader = rowNumber === 1;
        const cellLength = cell.value ? cell.value.toString().length : 10;
        const effectiveLength = isHeader ? cellLength * 1.2 : cellLength;
        if (effectiveLength > maxLength) {
          maxLength = effectiveLength;
        }
      });
      column.width = maxLength < 10 ? 12 : maxLength + 2;
    });
  };

  const setHeaderStyle = (row: Row) => {
    row.eachCell((cell: Cell) => {
      cell.style = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF50207A' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      };
    });
    row.commit();
  };

  const handleExport = async () => {
    if (!tasks || !habits || !transactions || !accounts || !selectedMonth) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Alliance App';
      workbook.created = new Date();

      const monthDate = parseISO(selectedMonth);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const accountIdToNameMap = new Map(accounts.map(acc => [acc.id, acc.name]));
      const getAccountName = (id: string | undefined) => id ? (accountIdToNameMap.get(id) || id) : '';

      const currencyStyle: Partial<Style> = { numFmt: '"PKR" #,##0' };
      const greenFont: Partial<Font> = { color: { argb: 'FF008000' }, bold: true };
      const redFont: Partial<Font> = { color: { argb: 'FFFF0000' }, bold: true };
      const yellowFont: Partial<Font> = { color: { argb: 'FFB08B00' }, bold: true };
      const blueFont: Partial<Font> = { color: { argb: 'FF0000FF' }, bold: true };
      const boldFont: Partial<Font> = { bold: true };
      const boldStyle: Partial<Style> = { font: boldFont };

      // --- Summary Sheet ---
      const summarySheet = workbook.addWorksheet('Summary');
      
      // Monthly Overview
      summarySheet.addRow(['Monthly Financial Overview']).font = { bold: true, size: 14 };
      summarySheet.mergeCells('A1:C1');
      summarySheet.addRow([]); // Spacer

      const monthlyTransactions = transactions.filter(t => isSameMonth(t.date, monthDate));
      const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      summarySheet.addRow(['Total Income', monthlyIncome]);
      summarySheet.addRow(['Total Expenses', monthlyExpenses]);
      summarySheet.addRow(['Net Savings', monthlyIncome - monthlyExpenses]);
      summarySheet.getRow(3).getCell(2).style = { ...currencyStyle, font: greenFont };
      summarySheet.getRow(4).getCell(2).style = { ...currencyStyle, font: redFont };
      summarySheet.getRow(5).getCell(2).style = { ...currencyStyle, font: boldFont };
      summarySheet.getRow(3).getCell(1).style = boldStyle;
      summarySheet.getRow(4).getCell(1).style = boldStyle;
      summarySheet.getRow(5).getCell(1).style = boldStyle;

      summarySheet.addRow([]); // Spacer

      // Expense Breakdown by Category
      const expenseBreakdownStartRow = 8;
      summarySheet.getCell(`A${expenseBreakdownStartRow -1}`).value = 'Expense Breakdown by Category';
      summarySheet.getCell(`A${expenseBreakdownStartRow -1}`).font = { bold: true, size: 14 };
      summarySheet.mergeCells(`A${expenseBreakdownStartRow -1}:C${expenseBreakdownStartRow -1}`);
      
      const expenseByCategory: { [key: string]: number } = {};
      monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
        const category = t.category || 'Uncategorized';
        expenseByCategory[category] = (expenseByCategory[category] || 0) + t.amount;
      });

      const categoryHeader = summarySheet.addRow(['Category', 'Total Spent']);
      setHeaderStyle(categoryHeader);

      Object.entries(expenseByCategory).sort(([,a], [,b]) => b - a).forEach(([category, total]) => {
        const row = summarySheet.addRow([category, total]);
        row.getCell(2).style = currencyStyle;
      });
      summarySheet.addRow([]); // Spacer

      // Account Balances
      const accountBalanceStartRow = summarySheet.lastRow!.number + 2;
      summarySheet.getCell(`A${accountBalanceStartRow -1}`).value = 'Account Balances';
      summarySheet.getCell(`A${accountBalanceStartRow -1}`).font = { bold: true, size: 14 };
      summarySheet.mergeCells(`A${accountBalanceStartRow -1}:C${accountBalanceStartRow -1}`);
      
      const balanceHeader = summarySheet.addRow(['Account', 'Ending Balance']);
      setHeaderStyle(balanceHeader);
      
      accounts.forEach(account => {
        const row = summarySheet.addRow([account.name, account.balance]);
        row.getCell(2).style = currencyStyle;
      });

      autoFitColumns(summarySheet);
      

      // --- Process Tasks ---
      const tasksSheet = workbook.addWorksheet('Tasks');
      tasksSheet.columns = [
        { header: 'Title', key: 'title' },
        { header: 'Description', key: 'description' },
        { header: 'Priority', key: 'priority' },
        { header: 'Due Date', key: 'dueDate' },
        { header: 'Status', key: 'status' },
      ];
      setHeaderStyle(tasksSheet.getRow(1));

      const filteredTasks = tasks.filter(t => t.dueDate && isSameMonth(parseISO(t.dueDate), monthDate))
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      
      filteredTasks.forEach(task => {
        const row = tasksSheet.addRow({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A',
          status: task.completed ? 'Completed' : 'Pending'
        });

        if (task.completed) row.getCell('status').font = greenFont;
        const priorityCell = row.getCell('priority');
        if(task.priority === 'High') priorityCell.font = redFont;
        if(task.priority === 'Medium') priorityCell.font = yellowFont;
        if(task.priority === 'Low') priorityCell.font = greenFont;
      });
      autoFitColumns(tasksSheet);


      // --- Process Habits ---
      const habitsSheet = workbook.addWorksheet('Habits');
      const filteredHabits = habits.filter(h => h.name);
      
      if (filteredHabits.length > 0) {
        const habitNames = filteredHabits.map(h => h.name);
        habitsSheet.columns = [{ header: 'Date', key: 'date' }, ...habitNames.map(name => ({ header: name, key: name }))];
        setHeaderStyle(habitsSheet.getRow(1));

        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        
        daysInMonth.forEach(day => {
            const dateStr = format(day, "yyyy-MM-dd");
            const rowData: { [key: string]: any } = { date: format(day, 'do MMMM yyyy') };
            
            filteredHabits.forEach(habit => {
                const completion = habit.completions[dateStr];
                rowData[habit.name] = completion?.status === 'completed' ? '✓' : '✗';
            });

            const row = habitsSheet.addRow(rowData);
            filteredHabits.forEach((habit, index) => {
                const cell = row.getCell(index + 2);
                if (cell.value === '✓') cell.font = greenFont;
                else cell.font = redFont;
            });
        });
      }
      autoFitColumns(habitsSheet);


      // --- Process Transactions ---
      const transactionsSheet = workbook.addWorksheet('Transactions');
      transactionsSheet.columns = [
        { header: 'Date', key: 'date' },
        { header: 'Type', key: 'type' },
        { header: 'Description', key: 'description' },
        { header: 'From', key: 'from' },
        { header: 'To', key: 'to' },
        { header: 'Category', key: 'category' },
        { header: 'Expense Type', key: 'subType' },
        { header: 'Amount', key: 'amount', style: currencyStyle },
      ];
      setHeaderStyle(transactionsSheet.getRow(1));
      
      const sortedTransactions = monthlyTransactions.sort((a, b) => a.createdAt - b.createdAt);
      
      sortedTransactions.forEach(t => {
        let fromAccount = '';
        let toAccount = '';
        let font: Partial<Font> | undefined = undefined;

        if (t.type === 'income') {
          toAccount = getAccountName(t.accountId);
          font = greenFont;
        } else if (t.type === 'expense') {
          fromAccount = getAccountName(t.accountId);
          font = redFont;
        } else if (t.type === 'transfer' && t.toAccountId) {
          fromAccount = getAccountName(t.accountId);
          toAccount = getAccountName(t.toAccountId);
          font = blueFont;
        }

        const row = transactionsSheet.addRow({
            date: format(t.date, 'PPP'),
            type: t.type,
            description: t.description,
            from: fromAccount,
            to: toAccount,
            category: t.category ?? '',
            subType: t.subType ?? '',
            amount: t.amount,
        });

        if (font) row.getCell('amount').font = font;
      });
      autoFitColumns(transactionsSheet);
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
a.href = url;
      a.download = `Alliance_Export_${format(monthDate, 'MMM_yyyy')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error("Failed to export Excel file:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return compact ? (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    ) : (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="month-select" className="text-sm font-medium">Select Month</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="month-select" disabled={availableMonths.length === 0} className="h-9">
              <SelectValue placeholder="Select a month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {format(parseISO(`${month}-01T00:00:00`), 'MMMM yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || !selectedMonth}
          size="sm"
          className="w-full"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export to Excel
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>
          Download an Excel file containing your tasks, habits, and financial data for a specific month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <label htmlFor="month-select" className="text-sm font-medium">Select Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select" disabled={availableMonths.length === 0}>
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(`${month}-01T00:00:00`), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || !selectedMonth}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export to Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
