
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

export type View = 'dashboard' | 'todos' | 'habits' | 'expenses' | 'settings';

export const AppViewContext = createContext<{
  view: View;
  setView: (view: View) => void;
}>({
  view: 'dashboard',
  setView: () => {},
});

export const AppViewContextProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<View>('dashboard');

  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
};
