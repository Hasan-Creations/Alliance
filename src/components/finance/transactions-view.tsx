
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2, PlusCircle, MinusCircle, ArrowRightLeft, Pencil } from "lucide-react";
import type { Account, Transaction, TransactionCategory, ExpenseSubType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, increment, writeBatch } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

const transactionSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  accountId: z.string().min(1, "Account is required"),
  toAccountId: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["income", "expense", "transfer"]),
  subType: z.enum(["Need", "Want"]).optional(),
  date: z.date({ required_error: "A date is required." }),
}).refine(data => data.type !== 'transfer' || (data.type === 'transfer' && data.toAccountId), {
  message: "Destination account is required for transfers",
  path: ["toAccountId"],
}).refine(data => data.type !== 'transfer' || data.accountId !== data.toAccountId, {
  message: "Source and destination accounts must be different",
  path: ["toAccountId"],
}).refine(data => data.type === 'transfer' || (data.category && data.category.length > 0), {
  message: "Category is required for income and expenses",
  path: ["category"],
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function TransactionsView() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const accountsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'accounts');
  }, [firestore, user]);
  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsRef);

  const transactionsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [firestore, user]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsRef);

  const categoriesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'transactionCategories');
  }, [firestore, user]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<TransactionCategory>(categoriesRef);

  // Lazy migration effect
  useEffect(() => {
    if (transactions && firestore && user) {
      const transactionsToMigrate = transactions.filter(t => !t.createdAt);
      if (transactionsToMigrate.length > 0) {
        console.log(`Found ${transactionsToMigrate.length} transactions to migrate.`);
        const batch = writeBatch(firestore);
        transactionsToMigrate.forEach(t => {
          const docRef = doc(firestore, 'users', user.uid, 'transactions', t.id);
          // The getTime() will be based on user's local timezone but consistent for backfill
          const newTimestamp = new Date(`${t.date}T00:00:00`).getTime();
          batch.update(docRef, { createdAt: newTimestamp });
        });
        batch.commit().then(() => {
          console.log("Successfully migrated old transactions.");
        }).catch(error => {
          console.error("Error migrating transactions: ", error);
        });
      }
    }
  }, [transactions, firestore, user]);


  const addTransaction = (data: Omit<Transaction, 'id'>) => {
    if (!transactionsRef || !firestore || !user || !accounts) return;
    addDocumentNonBlocking(transactionsRef, data);

    if (data.type === 'income') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', data.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(data.amount) });
    } else if (data.type === 'expense') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', data.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(-data.amount) });
    } else if (data.type === 'transfer' && data.toAccountId) {
      const fromAccountRef = doc(firestore, 'users', user.uid, 'accounts', data.accountId);
      updateDocumentNonBlocking(fromAccountRef, { balance: increment(-data.amount) });
      const toAccountRef = doc(firestore, 'users', user.uid, 'accounts', data.toAccountId);
      updateDocumentNonBlocking(toAccountRef, { balance: increment(data.amount) });
    }
  };

  const updateTransaction = (id: string, oldTransaction: Transaction, newData: Omit<Transaction, 'id'>) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'transactions', id);
    updateDocumentNonBlocking(docRef, newData);

    // Revert old transaction effect on balances
    if (oldTransaction.type === 'income') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', oldTransaction.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(-oldTransaction.amount) });
    } else if (oldTransaction.type === 'expense') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', oldTransaction.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(oldTransaction.amount) });
    } else if (oldTransaction.type === 'transfer' && oldTransaction.toAccountId) {
      const fromAccountRef = doc(firestore, 'users', user.uid, 'accounts', oldTransaction.accountId);
      updateDocumentNonBlocking(fromAccountRef, { balance: increment(oldTransaction.amount) });
      const toAccountRef = doc(firestore, 'users', user.uid, 'accounts', oldTransaction.toAccountId);
      updateDocumentNonBlocking(toAccountRef, { balance: increment(-oldTransaction.amount) });
    }

    // Apply new transaction effect on balances
    if (newData.type === 'income') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', newData.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(newData.amount) });
    } else if (newData.type === 'expense') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', newData.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(-newData.amount) });
    } else if (newData.type === 'transfer' && newData.toAccountId) {
      const fromAccountRef = doc(firestore, 'users', user.uid, 'accounts', newData.accountId);
      updateDocumentNonBlocking(fromAccountRef, { balance: increment(-newData.amount) });
      const toAccountRef = doc(firestore, 'users', user.uid, 'accounts', newData.toAccountId);
      updateDocumentNonBlocking(toAccountRef, { balance: increment(newData.amount) });
    }
  };

  const deleteTransaction = (transaction: Transaction) => {
    if (!firestore || !user || !accounts) return;
    const docRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
    deleteDocumentNonBlocking(docRef);

    if (transaction.type === 'income') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', transaction.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(-transaction.amount) });
    } else if (transaction.type === 'expense') {
      const accountRef = doc(firestore, 'users', user.uid, 'accounts', transaction.accountId);
      updateDocumentNonBlocking(accountRef, { balance: increment(transaction.amount) });
    } else if (transaction.type === 'transfer' && transaction.toAccountId) {
      const fromAccountRef = doc(firestore, 'users', user.uid, 'accounts', transaction.accountId);
      updateDocumentNonBlocking(fromAccountRef, { balance: increment(transaction.amount) });
      const toAccountRef = doc(firestore, 'users', user.uid, 'accounts', transaction.toAccountId);
      updateDocumentNonBlocking(toAccountRef, { balance: increment(-transaction.amount) });
    }
  };

  const addCategory = (name: string, type: 'income' | 'expense') => {
    if (!categoriesRef) return;
    const promise = addDocumentNonBlocking(categoriesRef, { name, type });
    promise.then((docRef) => {
      if(docRef) {
        form.setValue('category', docRef.id);
      }
    });
  };

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');

  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: "",
      amount: 0,
      accountId: "",
      toAccountId: "",
      category: "",
      type: "expense",
      subType: "Need",
      date: new Date(),
    },
  });

  const transactionType = form.watch('type');

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;

    const cashInHandAccount = accounts.find(a => a.name === 'Cash in Hand');
    const savingsAccount = accounts.find(a => a.name === 'Savings Account');

    if (transactionType === 'transfer') {
      form.setValue('accountId', cashInHandAccount?.id ?? '');
      form.setValue('toAccountId', savingsAccount?.id ?? '');
    } else {
      form.setValue('accountId', cashInHandAccount?.id ?? accounts[0].id);
    }
  }, [transactionType, accounts, form]);


  // Seed default categories if none exist
  useEffect(() => {
    if (user && !isLoadingCategories && categories && categories.length === 0) {
      addCategory("Other", "expense");
      addCategory("Other", "income");
    }
  }, [user, categories, isLoadingCategories]);


  const onSubmit = (values: TransactionFormValues) => {
    const categoryName = categories?.find(c => c.id === values.category)?.name;

    const transactionData: Omit<Transaction, 'id'> = {
      description: values.description,
      amount: values.amount,
      type: values.type,
      date: format(values.date, 'yyyy-MM-dd'),
      accountId: values.accountId,
      createdAt: editingTransaction?.createdAt ?? Date.now(), // Preserve original createdAt or set new
      ...(values.toAccountId && { toAccountId: values.toAccountId }),
      ...(categoryName && { category: categoryName }),
      ...(values.type === 'expense' && { subType: values.subType as ExpenseSubType }),
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, editingTransaction, transactionData);
    } else {
      addTransaction(transactionData);
    }

    form.reset();
    setEditingTransaction(null);
    setIsFormOpen(false);
  };

  const openNewTransactionDialog = () => {
    setEditingTransaction(null);
    const cashInHandAccount = accounts?.find(a => a.name === 'Cash in Hand');
    const savingsAccount = accounts?.find(a => a.name === 'Savings Account');
    const defaultExpenseCategory = categories?.find(c => c.type === 'expense' && c.name === 'Other');


    form.reset({
      description: "",
      amount: 0,
      category: defaultExpenseCategory?.id || "",
      type: "expense",
      subType: "Need",
      date: new Date(),
      accountId: cashInHandAccount?.id ?? (accounts && accounts.length > 0 ? accounts[0].id : ""),
      toAccountId: savingsAccount?.id ?? "",
    });

    // Set defaults based on type
    const newType = form.getValues('type');
    if (newType === 'transfer') {
      form.setValue('accountId', cashInHandAccount?.id ?? '');
      form.setValue('toAccountId', savingsAccount?.id ?? '');
    } else {
      form.setValue('accountId', cashInHandAccount?.id ?? (accounts?.[0]?.id || ''));
    }

    setIsFormOpen(true);
  };

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    const categoryId = categories?.find(c => c.name === transaction.category && c.type === transaction.type)?.id || "";

    form.reset({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: parseISO(transaction.date),
      accountId: transaction.accountId,
      toAccountId: transaction.toAccountId,
      category: categoryId,
      subType: transaction.subType,
    });
    setIsFormOpen(true);
  }, [form, categories]);

  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName) {
      addCategory(trimmedName, newCategoryType);
      setNewCategoryName('');
      setIsAddCategoryOpen(false);
    }
  };

  const availableMonths = useMemo(() => {
    if (!transactions) return [];
    const months = new Set<string>();
    transactions.forEach(transaction => {
      const month = format(parseISO(transaction.date), 'yyyy-MM');
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const availableCategories = useMemo(() => {
    if (!categories) return [];
    if (filterType === 'all' || filterType === 'transfer') return categories;
    return categories.filter(c => c.type === filterType);
  }, [categories, filterType]);

  // Reset category filter if it becomes invalid
  useEffect(() => {
    if (filterCategory !== 'all' && !availableCategories.find(c => c.id === filterCategory)) {
      setFilterCategory('all');
    }
  }, [availableCategories, filterCategory]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    const categoryName = categories?.find(c => c.id === filterCategory)?.name;

    return transactions
      .filter(t => filterMonth === 'all' || format(parseISO(t.date), 'yyyy-MM') === filterMonth)
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.type === 'transfer' || t.category === categoryName)
      .sort((a, b) => {
        const dateA = a.createdAt || new Date(`${a.date}T00:00:00`).getTime();
        const dateB = b.createdAt || new Date(`${b.date}T00:00:00`).getTime();
        return dateB - dateA;
      });
  }, [transactions, filterMonth, filterCategory, filterType, categories]);

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((total, t) => {
      if (t.type === 'income') return total + t.amount;
      if (t.type === 'expense') return total - t.amount;
      return total;
    }, 0);
  }, [filteredTransactions]);

  const filteredCategoriesForForm = useMemo(() => {
    if (!categories) return [];
    if (transactionType === 'income') {
      return categories.filter(c => c.type === 'income');
    }
    return categories.filter(c => c.type === 'expense');
  }, [categories, transactionType]);

  const getAccountName = (accountId: string) => {
    return accounts?.find(a => a.id === accountId)?.name ?? 'Unknown';
  }

  const renderTransactionDetails = (transaction: Transaction) => {
    if (transaction.type === 'transfer') {
      return `${getAccountName(transaction.accountId)} → ${getAccountName(transaction.toAccountId!)}`;
    }
    return `${getAccountName(transaction.accountId)} / ${transaction.category}`;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-base">Sort Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {isLoadingTransactions || isLoadingCategories ? <Skeleton className="h-10 w-full" /> : (
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
              <div>
                <Label htmlFor="filter-month" className="text-xs">Month</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger id="filter-month" className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>{format(parseISO(`${month}-01`), "MMMM yyyy")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-type" className="text-xs">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="filter-type" className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-category" className="text-xs">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory} disabled={filterType === 'transfer'}>
                  <SelectTrigger id="filter-category" className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 flex flex-row items-start justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Net flow for selection: <span className={cn("font-medium", filteredTotal >= 0 ? "text-primary" : "text-destructive")}>{formatAmount(filteredTotal)}</span>
            </CardDescription>
          </div>
           <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewTransactionDialog} disabled={!accounts || accounts.length === 0} size="sm">
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              const defaultCategory = categories?.find(c => c.type === value)?.id || "";
                              form.setValue('category', defaultCategory);
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-2"
                          >
                            <Label htmlFor="income" className="flex items-center gap-2 rounded-md border p-2 cursor-pointer has-[:checked]:border-primary">
                              <RadioGroupItem value="income" id="income" />
                              <PlusCircle className="h-4 w-4" /> Credit
                            </Label>
                            <Label htmlFor="expense" className="flex items-center gap-2 rounded-md border p-2 cursor-pointer has-[:checked]:border-primary">
                              <RadioGroupItem value="expense" id="expense" />
                              <MinusCircle className="h-4 w-4" /> Debit
                            </Label>
                            <Label htmlFor="transfer" className="flex items-center gap-2 rounded-md border p-2 cursor-pointer has-[:checked]:border-primary">
                              <RadioGroupItem value="transfer" id="transfer" />
                              <ArrowRightLeft className="h-4 w-4" /> Transfer
                            </Label>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Lunch with colleagues" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {transactionType === 'transfer' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="From Account" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="toAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="To Account" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select an account" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {accounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className={cn("grid gap-4", transactionType === 'expense' ? 'grid-cols-2' : 'grid-cols-1')}>
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <div className="flex items-center gap-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {filteredCategoriesForForm?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
                                    <div className="grid gap-4 py-2">
                                      <Input placeholder="Category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                                      <RadioGroup onValueChange={(value) => setNewCategoryType(value as 'income' | 'expense')} defaultValue={newCategoryType} className="grid grid-cols-2 gap-4">
                                        <Label htmlFor="cat_expense" className="flex items-center gap-2 rounded-md border p-2 cursor-pointer has-[:checked]:border-primary">
                                          <RadioGroupItem value="expense" id="cat_expense" /> Expense
                                        </Label>
                                        <Label htmlFor="cat_income" className="flex items-center gap-2 rounded-md border p-2 cursor-pointer has-[:checked]:border-primary">
                                          <RadioGroupItem value="income" id="cat_income" /> Income
                                        </Label>
                                      </RadioGroup>
                                    </div>
                                    <DialogFooter>
                                      <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                                      <Button type="button" onClick={handleAddCategory}>Add Category</Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {transactionType === 'expense' && (
                          <FormField
                            control={form.control}
                            name="subType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expense Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Need">Need</SelectItem>
                                    <SelectItem value="Want">Want</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </>
                  )}

                  <DialogFooter className="grid grid-cols-2 gap-2 pt-2">
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit">{editingTransaction ? "Save Changes" : "Add Transaction"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Account / Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransactions ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="p-2">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">{format(parseISO(transaction.date), 'M/d/yy')}</div>
                    </TableCell>
                    <TableCell className="p-2">{renderTransactionDetails(transaction)}</TableCell>
                    <TableCell className={cn("text-right font-medium p-2", transaction.type === 'income' ? 'text-primary' : transaction.type === 'expense' ? 'text-destructive' : 'text-muted-foreground')}>
                      {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <div className="flex flex-col items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteTransaction(transaction)} aria-label="Delete transaction">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEdit(transaction)} aria-label="Edit transaction">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No transactions match your filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    

    

