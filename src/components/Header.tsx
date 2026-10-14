import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Library, Menu, Search, X } from 'lucide-react';
import type { Category, View } from '../types';
import SectionsMenu from './SectionsMenu';
import type { Section } from './SectionsMenu';

const NAV: { view: View; label: string }[] = [
  { view: 'Home', label: 'Katalog' },
  { view: 'Saved', label: 'Saqlanganlar' },
  { view: 'About', label: 'Biz haqimizda' },
];

interface Props {
  view: View;
  onNavigate: (view: View) => void;
  query: string;
  onQueryChange: (query: string) => void;
  savedCount: number;
  sections: Section[];
  onPickSection: (category: Category) => void;
}

export default function Header({ view, onNavigate, query, onQueryChange, savedCount, sections, onPickSection }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // "/" focuses search, like most reading and docs sites
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (next: View) => {
    onNavigate(next);
    setMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-ink/10 bg-paper/90 py-2.5 shadow-[0_8px_24px_-18px_rgba(31,33,25,0.5)] backdrop-blur-md'
          : 'border-transparent bg-paper/60 py-4 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
        <motion.button
          type="button"
          onClick={() => go('Home')}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2.5"
          aria-label="Ziyo Kutubxonasi — bosh sahifa"
        >
          <motion.span
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-moss text-white"
          >
            <Library size={20} />
          </motion.span>
          <span className="font-serif text-2xl font-bold tracking-tight">Ziyo Kutubxonasi</span>
        </motion.button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Asosiy menyu">
          {NAV.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => go(item.view)}
              aria-current={view === item.view ? 'page' : undefined}
              className={`relative rounded-full px-4 py-2 font-sans text-sm font-medium transition-colors ${
                view === item.view ? 'text-moss' : 'text-ink/70 hover:text-moss'
              }`}
            >
              {view === item.view && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-moss/10"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {item.label}
                {item.view === 'Saved' && savedCount > 0 && (
                  <motion.span
                    key={savedCount}
                    initial={{ scale: 1.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-moss px-1.5 text-[11px] font-semibold text-white"
                  >
                    {savedCount}
                  </motion.span>
                )}
              </span>
            </button>
          ))}
          <SectionsMenu sections={sections} onPick={onPickSection} variant="desktop" />
        </nav>

        <div className="flex items-center gap-2">
          <label className="group relative hidden sm:block">
            <span className="sr-only">Kitob yoki muallif qidirish</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 transition-colors group-focus-within:text-moss"
              size={17}
            />
            <input
              ref={searchRef}
              type="search"
              placeholder="Kitob yoki muallif…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-48 rounded-full border border-ink/10 bg-white py-2 pl-10 pr-9 font-sans text-sm transition-all duration-300 placeholder:text-ink/40 focus:w-72 focus:border-moss focus:outline-none focus:ring-4 focus:ring-moss/10 [&::-webkit-search-cancel-button]:hidden lg:w-60"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Qidiruvni tozalash"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 hover:text-ink"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-ink/15 px-1.5 font-sans text-[11px] text-ink/40 group-focus-within:hidden">
                /
              </kbd>
            )}
          </label>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-4 px-5 pb-5 pt-4 sm:px-6">
              <label className="relative block sm:hidden">
                <span className="sr-only">Kitob yoki muallif qidirish</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={17} />
                <input
                  type="search"
                  placeholder="Kitob yoki muallif…"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  className="w-full rounded-full border border-ink/10 bg-white py-3 pl-10 pr-4 font-sans text-sm focus:border-moss focus:outline-none focus:ring-4 focus:ring-moss/10"
                />
              </label>
              <nav className="flex flex-col gap-1" aria-label="Mobil menyu">
                {NAV.map((item, i) => (
                  <motion.button
                    key={item.view}
                    type="button"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => go(item.view)}
                    aria-current={view === item.view ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left font-sans text-base font-medium ${
                      view === item.view ? 'bg-moss text-white' : 'bg-white text-ink'
                    }`}
                  >
                    {item.label}
                    {item.view === 'Saved' && savedCount > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${view === item.view ? 'bg-white/20' : 'bg-moss text-white'}`}>
                        {savedCount}
                      </span>
                    )}
                  </motion.button>
                ))}
              </nav>
              <SectionsMenu
                sections={sections}
                onPick={(category) => {
                  onPickSection(category);
                  setMenuOpen(false);
                }}
                variant="mobile"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
