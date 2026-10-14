import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import type { Category } from '../types';

export interface Section {
  name: Category;
  count: number;
}

interface Props {
  sections: Section[];
  onPick: (category: Category) => void;
  /** 'desktop' is a dropdown in the header; 'mobile' is a chip grid inside the mobile menu. */
  variant: 'desktop' | 'mobile';
}

/** Quick jump to any section (category) of the library from the header. */
export default function SectionsMenu({ sections, onPick, variant }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (name: Category) => {
    onPick(name);
    setOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div>
        <p className="mb-2 px-1 font-sans text-xs font-medium text-ink/50">Bo'limlar</p>
        <div className="grid grid-cols-2 gap-2">
          {sections.map((s, i) => (
            <motion.button
              key={s.name}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.025 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => pick(s.name)}
              className="flex min-h-[3rem] items-center justify-between gap-2 rounded-2xl border border-ink/10 bg-white px-3.5 py-2 text-left font-sans text-sm leading-snug"
            >
              <span>{s.name}</span>
              <span className="shrink-0 text-xs text-ink/40">{s.count}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-sans text-sm font-medium transition-colors ${
          open ? 'bg-moss/10 text-moss' : 'text-ink/70 hover:text-moss'
        }`}
      >
        Bo'limlar
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top center' }}
            className="absolute left-1/2 top-full z-50 mt-3 w-[min(560px,90vw)] -translate-x-1/2 rounded-3xl border border-ink/10 bg-paper p-3 shadow-[0_24px_50px_-16px_rgba(31,33,25,0.45)]"
          >
            <ul className="grid grid-cols-2 gap-1">
              {sections.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => pick(s.name)}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left font-sans text-sm transition-colors hover:bg-moss/10"
                  >
                    <span className="font-medium text-ink/85 transition-colors group-hover:text-moss">{s.name}</span>
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50 group-hover:bg-moss/15 group-hover:text-moss">
                      {s.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
