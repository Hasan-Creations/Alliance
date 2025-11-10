
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import ExcelJS, { type Worksheet, type Column, type Cell } from 'exceljs';
import type { Task, Habit, Transaction, Account } from '@/lib/types';
import { Download, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function DataExporter() {
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
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsRef);
  const { data: accounts, isLoading: loadingAccounts } = useCollection<Account>(accountsRef);

  const isLoading = loadingTasks || loadingHabits || loadingTransactions || loadingAccounts;

  const availableMonths = useMemo(() => {
    const allData = [...(tasks ?? []), ...(transactions ?? []), ...(habits?.flatMap(h => Object.keys(h.completions).map(date => ({ date }))) ?? [])];
    const months = new Set<string>();

    allData.forEach(item => {
      const itemDate = (item as any).dueDate || (item as any).date;
      if (itemDate && typeof itemDate === 'string') {
        try {
          months.add(format(startOfMonth(parseISO(itemDate)), 'yyyy-MM'));
        } catch (e) {
          console.warn(`Invalid date format found: ${itemDate}`);
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

  const handleExport = async () => {
    if (!tasks || !habits || !transactions || !accounts || !selectedMonth) return;
    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Alliance App';
      workbook.created = new Date();

      const monthDate = parseISO(selectedMonth);
      
      const accountIdToNameMap = new Map(accounts.map(acc => [acc.id, acc.name]));
      const getAccountName = (id: string | undefined) => id ? (accountIdToNameMap.get(id) || id) : '';

      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF50207A' } },
        alignment: { vertical: 'middle', horizontal: 'center' },
      };
      const greenFont: Partial<ExcelJS.Font> = { color: { argb: 'FF008000' }, bold: true };
      const redFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFF0000' }, bold: true };
      const yellowFont: Partial<ExcelJS.Font> = { color: { argb: 'FFB08B00' }, bold: true };
      const blueFont: Partial<ExcelJS.Font> = { color: { argb: 'FF0000FF' }, bold: true };
      
      // --- Process Tasks ---
      const tasksSheet = workbook.addWorksheet('Tasks');
      tasksSheet.columns = [
        { header: 'Title', key: 'title' },
        { header: 'Description', key: 'description' },
        { header: 'Priority', key: 'priority' },
        { header: 'Due Date', key: 'dueDate' },
        { header: 'Status', key: 'status' },
      ];
      
      tasksSheet.getRow(1).eachCell((cell: Cell) => cell.style = headerStyle);

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

        if (task.completed) {
            row.getCell('status').font = greenFont;
        }

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
        habitsSheet.getRow(1).eachCell((cell: Cell) => cell.style = headerStyle);

        const daysInMonth = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) });
        
        daysInMonth.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const rowData: { [key: string]: any } = { date: format(day, 'do MMMM yyyy') };
            
            filteredHabits.forEach(habit => {
                const status = habit.completions[dateStr];
                if (status === 'completed') {
                    rowData[habit.name] = 'Completed';
                } else {
                    rowData[habit.name] = 'Not Completed';
                }
            });

            const row = habitsSheet.addRow(rowData);
            filteredHabits.forEach((habit, index) => {
                const cell = row.getCell(index + 2);
                if (cell.value === 'Completed') {
                    cell.font = greenFont;
                } else if (cell.value === 'Not Completed') {
                    cell.font = redFont;
                }
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
        { header: 'Amount', key: 'amount', style: { numFmt: '"PKR" #,##0.00' } },
      ];
      transactionsSheet.getRow(1).eachCell((cell: Cell) => cell.style = headerStyle);
      
      const filteredTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), monthDate))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      filteredTransactions.forEach(t => {
        let fromAccount = '';
        let toAccount = '';
        let font: Partial<ExcelJS.Font> | undefined = undefined;

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
            date: format(parseISO(t.date), 'PPP'),
            type: t.type,
            description: t.description,
            from: fromAccount,
            to: toAccount,
            category: t.category ?? '',
            subType: t.subType ?? '',
            amount: t.amount,
        });

        if (font) {
          row.font = font;
        }
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
