import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cat, Litter, Task } from '@/types';

interface DataContextType {
  cats: Cat[];
  litters: Litter[];
  tasks: Task[];
  addCat: (cat: Cat) => void;
  updateCat: (cat: Cat) => void;
  deleteCat: (id: string) => void;
  addLitter: (litter: Litter) => void;
  updateLitter: (litter: Litter) => void;
  deleteLitter: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  cats: 'cattery_cats',
  litters: 'cattery_litters',
  tasks: 'cattery_tasks',
};

function loadFromStorage<T>(key: string, defaultValue: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [cats, setCats] = useState<Cat[]>(() => loadFromStorage(STORAGE_KEYS.cats, []));
  const [litters, setLitters] = useState<Litter[]>(() => loadFromStorage(STORAGE_KEYS.litters, []));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.tasks, []));

  useEffect(() => saveToStorage(STORAGE_KEYS.cats, cats), [cats]);
  useEffect(() => saveToStorage(STORAGE_KEYS.litters, litters), [litters]);
  useEffect(() => saveToStorage(STORAGE_KEYS.tasks, tasks), [tasks]);

  const addCat = (cat: Cat) => setCats(prev => [...prev, cat]);
  const updateCat = (cat: Cat) => setCats(prev => prev.map(c => c.id === cat.id ? cat : c));
  const deleteCat = (id: string) => setCats(prev => prev.filter(c => c.id !== id));

  const addLitter = (litter: Litter) => setLitters(prev => [...prev, litter]);
  const updateLitter = (litter: Litter) => setLitters(prev => prev.map(l => l.id === litter.id ? litter : l));
  const deleteLitter = (id: string) => setLitters(prev => prev.filter(l => l.id !== id));

  const addTask = (task: Task) => setTasks(prev => [...prev, task]);
  const updateTask = (task: Task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <DataContext.Provider value={{
      cats, litters, tasks,
      addCat, updateCat, deleteCat,
      addLitter, updateLitter, deleteLitter,
      addTask, updateTask, deleteTask,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
