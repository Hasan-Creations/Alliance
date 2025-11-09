
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO, startOfMonth, isSameMonth } from 'date-fns';
import ExcelJS from 'exceljs';
import type { Task, Habit, Transaction, Account } from '@/lib/types';
import { Download, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function DataExporter() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const tasksRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'tasks') : null, [user, firestore]);
  const habitsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'habits') : null, [user, firestore]);
  const transactionsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transactions') : null, [user, firestore]);
  const accountsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'accounts') : null, [user, firestore]);

  const { data: tasks, isLoading: loadingTasks } = useCollection<Task>(tasksRef);
  const { data: habits, isLoading: loadingHabits } = useCollection<Habit>(habitsRef);
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsRef);
  const { data: accounts, isLoading: loadingAccounts } = useCollection<Account>(accountsRef);

  const isLoading = loadingTasks || loadingHabits || loadingTransactions || loadingAccounts;

  const availableMonths = useMemo(() => {
    const allData = [...(tasks ?? []), ...(transactions ?? [])];
    const months = new Set<string>();

    allData.forEach(item => {
      if ('dueDate' in item && item.dueDate) {
        months.add(format(startOfMonth(parseISO(item.dueDate)), 'yyyy-MM'));
      }
      if ('date' in item && item.date) {
        months.add(format(startOfMonth(parseISO(item.date)), 'yyyy-MM'));
      }
    });

    return Array.from(months).sort().reverse();
  }, [tasks, transactions]);
  
  const setColumnWidths = (sheet: ExcelJS.Worksheet) => {
    const columnWidths: { [key: string]: number } = {};

    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const column = sheet.getColumn(colNumber);
            const currentLength = cell.value ? cell.value.toString().length : 10;
            if (!column.width || currentLength > column.width) {
              column.width = currentLength + 2; // Add a little padding
            }
        });
    });
  };

  const handleExport = async () => {
    if (!tasks || !habits || !transactions || !accounts) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Alliance App';
      workbook.created = new Date();

      const monthDate = selectedMonth !== 'all' ? parseISO(selectedMonth) : null;
      
      const accountIdToNameMap = new Map(accounts.map(acc => [acc.id, acc.name]));
      const getAccountName = (id: string | undefined) => id ? (accountIdToNameMap.get(id) || id) : '';

      // --- Define Styles ---
      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF50207A' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      };
      const greenFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
      const redFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4CCCC' } };
      const blueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E0E3' } };

      const priorityHighFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFF0000' }, bold: true };
      const priorityMediumFont: Partial<ExcelJS.Font> = { color: { argb: 'FFB08B00' }, bold: true };
      const priorityLowFont: Partial<ExcelJS.Font> = { color: { argb: 'FF008000' }, bold: true };
      
      const completedFont: Partial<ExcelJS.Font> = { color: { argb: 'FF008000' }, bold: true };
      const missedFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFF0000' }, bold: true };

      // --- Process Tasks ---
      const tasksSheet = workbook.addWorksheet('Tasks');
      tasksSheet.columns = [
        { header: 'Title', key: 'title' },
        { header: 'Description', key: 'description' },
        { header: 'Priority', key: 'priority' },
        { header: 'Due Date', key: 'dueDate' },
        { header: 'Status', key: 'status' },
      ];
      tasksSheet.getRow(1).eachCell(cell => cell.style = headerStyle);
      const filteredTasks = (monthDate ? tasks.filter(t => t.dueDate && isSameMonth(parseISO(t.dueDate), monthDate)) : tasks)
          .sort((a, b) => (a.dueDate && b.dueDate) ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() : 0);
      
      filteredTasks.forEach(task => {
        const row = tasksSheet.addRow({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? format(parseISO(task.dueDate), 'PPP') : 'N/A',
          status: task.completed ? 'Completed' : 'Pending'
        });

        if (task.completed) {
            row.getCell('status').font = completedFont;
        }

        const priorityCell = row.getCell('priority');
        if(task.priority === 'High') priorityCell.font = priorityHighFont;
        if(task.priority === 'Medium') priorityCell.font = priorityMediumFont;
        if(task.priority === 'Low') priorityCell.font = priorityLowFont;
      });
      setColumnWidths(tasksSheet);


      // --- Process Habits ---
      const habitsSheet = workbook.addWorksheet('Habits');
      habitsSheet.columns = [
        { header: 'Habit Name', key: 'name' },
        { header: 'Date', key: 'date' },
        { header: 'Status', key: 'status' },
      ];
      habitsSheet.getRow(1).eachCell(cell => cell.style = headerStyle);
      const habitsData = habits.flatMap(habit => {
          const entries = Object.entries(habit.completions);
          const relevantEntries = monthDate ? entries.filter(([date]) => isSameMonth(parseISO(date), monthDate)) : entries;
          return relevantEntries.map(([date, status]) => ({ name: habit.name, date: format(parseISO(date), 'PPP'), status }));
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      habitsData.forEach(item => {
        const row = habitsSheet.addRow(item);
        const statusCell = row.getCell('status');
        if (item.status === 'completed') {
            statusCell.font = completedFont;
        } else if (item.status === 'missed') {
            statusCell.font = missedFont;
        }
      });
      setColumnWidths(habitsSheet);


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
        { header: 'Amount', key: 'amount', style: { numFmt: '"PKR" #,##0.00' } },
      ];
      transactionsSheet.getRow(1).eachCell(cell => cell.style = headerStyle);
      const filteredTransactions = (monthDate ? transactions.filter(t => isSameMonth(parseISO(t.date), monthDate)) : transactions)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      filteredTransactions.forEach(t => {
        let fromAccount = '';
        let toAccount = '';
        let fill: ExcelJS.Fill | undefined = undefined;

        if (t.type === 'income') {
          toAccount = getAccountName(t.accountId);
          fill = greenFill;
        } else if (t.type === 'expense') {
          fromAccount = getAccountName(t.accountId);
          fill = redFill;
        } else if (t.type === 'transfer' && t.toAccountId) {
          fromAccount = getAccountName(t.accountId);
          toAccount = getAccountName(t.toAccountId);
          fill = blueFill;
        }

        const row = transactionsSheet.addRow({
            date: format(parseISO(t.date), 'PPP'),
            type: t.type,
            description: t.description,
            from: fromAccount,
            to: toAccount,
            category: t.category ?? '',
            subType: t.subType ?? '',
            amount: t.amount,
        });

        if (fill) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = fill;
          });
        }
      });
      setColumnWidths(transactionsSheet);
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Alliance_Export_${selectedMonth === 'all' ? 'All_Data' : selectedMonth}.xlsx`;
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
    return (
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>
          Download an Excel file containing your tasks, habits, and financial data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <label htmlFor="month-select" className="text-sm font-medium">Select Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Data</SelectItem>
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
            disabled={isExporting}
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
