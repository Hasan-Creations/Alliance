'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreVertical, Trash2, X } from 'lucide-react';
import { useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Note } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: () => void;
}

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleDelete = () => {
    if (!firestore || !user) return;
    const noteRef = doc(firestore, 'users', user.uid, 'notes', note.id);
    deleteDocumentNonBlocking(noteRef);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card 
        className="h-full flex flex-col group transition-all duration-200 ease-in-out hover:shadow-md cursor-pointer border-zinc-200 dark:border-zinc-800"
        onClick={() => setIsViewDialogOpen(true)}
      >
        <CardHeader className="flex flex-row items-start justify-between p-3 pb-2 pr-2 pt-3 space-y-0">
          {note.title && (
            <CardTitle className="tracking-tight text-base font-semibold leading-tight break-words pr-2 line-clamp-2">
              {note.title}
            </CardTitle>
          )}
          {!note.title && <div className="flex-1" />}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1"
                onClick={(e) => e.stopPropagation()} // Prevent card click
              >
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onEdit}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-3 flex-1">
          <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words line-clamp-[8]">
            {note.content}
          </p>
        </CardContent>
      </Card>

      {/* View Note Dialog - Google Keep Style */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent 
          className="p-0 gap-0 w-full sm:max-w-2xl h-fit max-h-[75vh] flex flex-col overflow-hidden rounded-xl border shadow-lg"
        >
          <DialogHeader className="p-4 pb-2 shrink-0">
             <div className="flex items-start justify-between">
                {note.title ? (
                  <DialogTitle className="text-xl font-semibold leading-none tracking-tight pr-8 break-words">
                    {note.title}
                  </DialogTitle>
                ) : (
                  <DialogTitle className="sr-only">
                    Note
                  </DialogTitle>
                )}
             </div>
          </DialogHeader>

          <div className="px-5 py-2 text-base text-foreground/90 whitespace-pre-wrap break-words overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {note.content}
          </div>

          <div className="p-2 pt-4 flex justify-end shrink-0 bg-transparent">
             <Button 
                variant="ghost" 
                onClick={() => {
                  setIsViewDialogOpen(false);
                  onEdit();
                }}
                className="text-sm font-medium"
             >
                Edit Note
             </Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
