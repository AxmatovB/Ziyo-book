import { useCallback, useEffect, useState } from 'react';
import type { View } from './types';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) - state still works in memory */
  }
}

export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial));
  useEffect(() => writeStorage(key, value), [key, value]);
  return [value, setValue] as const;
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

const VIEW_TO_HASH: Record<View, string> = {
  Home: '',
  Saved: '#/saqlanganlar',
  About: '#/biz-haqimizda',
};

function viewFromHash(): View {
  const hash = window.location.hash;
  if (hash === VIEW_TO_HASH.Saved) return 'Saved';
  if (hash === VIEW_TO_HASH.About) return 'About';
  return 'Home';
}

/** Keeps the current view in the URL hash so the browser back button and reloads work. */
export function useHashView() {
  const [view, setViewState] = useState<View>(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setViewState(viewFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setView = useCallback((next: View) => {
    setViewState(next);
    const hash = VIEW_TO_HASH[next];
    if (window.location.hash !== hash) {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search);
    }
  }, []);

  return [view, setView] as const;
}
