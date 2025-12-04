'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Note } from '@/lib/types';

const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Note content cannot be empty.'),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface NoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
}

export function NoteDialog({ isOpen, onOpenChange, note }: NoteDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content,
      });
    } else {
      form.reset({
        title: '',
        content: '',
      });
    }
  }, [note, form, isOpen]);

  const onSubmit = (values: NoteFormValues) => {
    if (!firestore || !user) return;

    if (note) {
      // Update existing note
      const noteRef = doc(firestore, 'users', user.uid, 'notes', note.id);
      updateDocumentNonBlocking(noteRef, {
        ...values,
        updatedAt: Date.now(),
      });
    } else {
      // Add new note
      const notesRef = collection(firestore, 'users', user.uid, 'notes');
      addDocumentNonBlocking(notesRef, {
        ...values,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Title" {...field} className="text-lg font-semibold border-0 focus-visible:ring-0 px-2 shadow-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Take a note..."
                      {...field}
                      className="min-h-[200px] border-0 focus-visible:ring-0 px-2 shadow-none resize-none"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Close</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}