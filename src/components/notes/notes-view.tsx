'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Note } from '@/lib/types';
import { NoteCard } from './note-card';
import { NoteDialog } from './note-dialog';

export const NotesView = React.memo(function NotesView() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const notesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'notes');
  }, [firestore, user]);

  const { data: notes, isLoading } = useCollection<Note>(notesRef);

  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes]);

  const handleAddNote = () => {
    setEditingNote(null);
    setIsDialogOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Notes</h1>
          <p className="text-muted-foreground">Your digital scratchpad.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="columns-2 gap-4">
          <Skeleton className="h-32 w-full break-inside-avoid rounded-lg mb-4" />
          <Skeleton className="h-48 w-full break-inside-avoid rounded-lg mb-4" />
          <Skeleton className="h-24 w-full break-inside-avoid rounded-lg mb-4" />
          <Skeleton className="h-40 w-full break-inside-avoid rounded-lg mb-4" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">You have no notes yet.</p>
          <p className="text-sm text-muted-foreground">Click the '+' button to add one.</p>
        </div>
      ) : (
        <div className="columns-2 gap-4">
          {sortedNotes.map((note) => (
            <div key={note.id} className="break-inside-avoid mb-4">
              <NoteCard note={note} onEdit={() => handleEditNote(note)} />
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleAddNote}
        className="fixed bottom-20 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-xl shadow-xl z-50 transition-transform hover:scale-105"
        aria-label="Add new note"
      >
        <Plus className="h-7 w-7" />
      </Button>

      <NoteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        note={editingNote}
      />
    </div>
  );
});

NotesView.displayName = 'NotesView';
