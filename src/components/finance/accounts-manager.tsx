'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Account } from '@/lib/types';
import { Plus } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  balance: z.coerce.number().min(0, 'Initial balance cannot be negative'),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountsManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const accountsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'accounts');
  }, [firestore, user]);

  const { data: accounts, isLoading: isLoadingAccounts } =
    useCollection<Account>(accountsRef);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      balance: 0,
    },
  });

  // Seed default account if none exist
  useEffect(() => {
    if (user && !isLoadingAccounts && accounts && accounts.length === 0) {
      addAccount({ name: 'Cash in Hand', balance: 0 });
      addAccount({ name: 'Savings Account', balance: 0 });
    }
  }, [user, accounts, isLoadingAccounts]);

  const addAccount = (data: Omit<Account, 'id'>) => {
    if (!accountsRef) return;
    addDocumentNonBlocking(accountsRef, data);
  };

  const onSubmit = (values: AccountFormValues) => {
    addAccount(values);
    form.reset();
    setIsFormOpen(false);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <Card>
      <CardHeader className="p-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cash Accounts</CardTitle>
          <CardDescription>
            Your accounts and their current balances.
          </CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Savings Account" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Balance</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Add Account</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-3">
        {isLoadingAccounts ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No accounts found. Add one to get started.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {accounts.map(account => (
              <div
                key={account.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <span className="font-semibold">{account.name}</span>
                <span className="font-base">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
