
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';

export interface Person {
    id: string;
    name: string;
    createdAt: number;
}

export const PersonContext = createContext<{
  persons: Person[];
  activePerson: Person | null;
  setActivePerson: (person: Person) => void;
  addPerson: (name: string) => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  isPersonLoading: boolean;
}>({
  persons: [],
  activePerson: null,
  setActivePerson: () => {},
  addPerson: async () => {},
  deletePerson: async () => {},
  isPersonLoading: true,
});

export const PersonProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activePerson, setActivePersonState] = useState<Person | null>(null);

  const personsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'persons');
  }, [firestore, user]);

  const { data: persons, isLoading: isPersonsLoading } = useCollection<Person>(personsRef);

  // Corrected loading logic
  const isPersonLoading = isPersonsLoading || !activePerson;

  const setActivePerson = useCallback((person: Person) => {
    setActivePersonState(person);
    if (typeof window !== 'undefined') {
        localStorage.setItem('activePersonId', person.id);
    }
  }, []);

  // Initialize default person or load from storage
  useEffect(() => {
    if (isPersonsLoading || !persons) return;

    const initialize = async () => {
        if (persons.length === 0) {
            // Only create if there are truly no persons for this user.
            const defaultPerson = {
                name: "Myself",
                createdAt: Date.now(),
            };
            if(personsRef) {
                // We await here because setting the active person depends on this operation completing.
                const docRef = await addDocumentNonBlocking(personsRef, defaultPerson);
                if (docRef) {
                  const newPerson = { ...defaultPerson, id: docRef.id };
                  setActivePerson(newPerson);
                }
            }
        } else {
            const storedPersonId = localStorage.getItem('activePersonId');
            const personToActivate = persons.find(p => p.id === storedPersonId) || persons[0];
            setActivePerson(personToActivate);
        }
    };
    
    initialize();

  }, [isPersonsLoading, persons, personsRef, setActivePerson]);


  const addPerson = useCallback(async (name: string) => {
    if (!personsRef) return;
    await addDocumentNonBlocking(personsRef, { name, createdAt: Date.now() });
  }, [personsRef]);

  const deletePerson = useCallback(async (personId: string) => {
    if (!firestore || !user || !persons || persons.length <= 1) return; // Prevent deleting the last person

    // Delete person document
    const personDocRef = doc(firestore, 'users', user.uid, 'persons', personId);
    await deleteDocumentNonBlocking(personDocRef);

    // If the deleted person was the active one, switch to another
    if (activePerson?.id === personId) {
      const newActivePerson = persons.find(p => p.id !== personId);
      if(newActivePerson) {
        setActivePerson(newActivePerson);
      }
    }
  }, [firestore, user, persons, activePerson, setActivePerson]);
  
  const value = {
    persons: persons || [],
    activePerson,
    setActivePerson,
    addPerson,
    deletePerson,
    isPersonLoading,
  };

  return (
    <PersonContext.Provider value={value}>
      {children}
    </PersonContext.Provider>
  );
};

export const usePerson = () => useContext(PersonContext);
